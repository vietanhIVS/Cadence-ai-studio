"use client";
import { useState, useEffect } from 'react';
import {
  Sparkles,
  History,
  SlidersHorizontal,
  Dumbbell,
  Flame,
  Zap,
  HeartPulse,
  RotateCcw,
  Check,
  Edit3,
  Info,
  Lock,
  ChevronRight,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { State, CycleDay, exerciseLibrary, uid } from '@/lib/cadence';
import { GeneratedProgramResult, GeneratedCycleDay } from '@/app/api/ai-program/route';

interface AIProgramGeneratorModalProps {
  open: boolean;
  onClose: () => void;
  state: State;
  unit: 'kg' | 'lb';
  onApplyActive: (program: { name: string; description: string; days: CycleDay[] }) => Promise<void>;
  onSaveOnly: (program: { name: string; description: string; days: CycleDay[] }) => Promise<void>;
  onEditInEditor: (program: { name: string; description: string; days: CycleDay[] }) => void;
  initialMode?: 'select' | 'preferences';
}

type Step = 'select' | 'preferences' | 'loading' | 'preview';

type Goal = 'Hypertrophy' | 'Strength' | 'Fat Loss' | 'General Fitness';
type Frequency = '2-3 days / week' | '4-5 days / week' | '6 days / week';
type Equipment = 'Commercial Gym' | 'Dumbbells Only / Home Gym' | 'Bodyweight / Calisthenics';
type Duration = '30 - 45 min' | '45 - 60 min' | '60 - 90 min';

const GOAL_OPTIONS: Array<{ value: Goal; label: string; desc: string; icon: typeof Dumbbell }> = [
  { value: 'Hypertrophy', label: 'Hypertrophy', desc: 'Build Muscle & Shape', icon: Dumbbell },
  { value: 'Strength', label: 'Strength', desc: 'Max Force & Heavy Compounds', icon: Zap },
  { value: 'Fat Loss', label: 'Fat Loss', desc: 'Cut & High Work Capacity', icon: Flame },
  { value: 'General Fitness', label: 'General Fitness', desc: 'Health, Longevity & Mobility', icon: HeartPulse },
];

const FREQUENCY_OPTIONS: Array<{ value: Frequency; label: string; sub: string }> = [
  { value: '2-3 days / week', label: '2–3 days / wk', sub: 'Full body emphasis' },
  { value: '4-5 days / week', label: '4–5 days / wk', sub: 'Upper/Lower or PPL' },
  { value: '6 days / week', label: '6 days / wk', sub: 'High frequency split' },
];

const EQUIPMENT_OPTIONS: Array<{ value: Equipment; label: string; sub: string }> = [
  { value: 'Commercial Gym', label: 'Commercial Gym', sub: 'Barbells, dumbbells, cables & machines' },
  { value: 'Dumbbells Only / Home Gym', label: 'Dumbbells Only', sub: 'Free weights & adjustable bench' },
  { value: 'Bodyweight / Calisthenics', label: 'Bodyweight Only', sub: 'Calisthenics, pull-up bar, floor' },
];

const DURATION_OPTIONS: Array<{ value: Duration; label: string; sub: string }> = [
  { value: '30 - 45 min', label: '30–45 min', sub: 'Express high-efficiency' },
  { value: '45 - 60 min', label: '45–60 min', sub: 'Standard complete session' },
  { value: '60 - 90 min', label: '60–90 min', sub: 'Extended high-volume' },
];

const LOADING_STATUS_MESSAGES = [
  "Analyzing goals & recovery constraints...",
  "Structuring optimal training split...",
  "Selecting compound & accessory movements...",
  "Calibrating volume, rep targets & rest timers...",
  "Finalizing your progressive training cycle..."
];

export default function AIProgramGeneratorModal({
  open,
  onClose,
  state,
  unit,
  onApplyActive,
  onSaveOnly,
  onEditInEditor,
  initialMode = 'select'
}: AIProgramGeneratorModalProps) {
  const [step, setStep] = useState<Step>('select');
  const [selectedRoute, setSelectedRoute] = useState<'history' | 'preferences'>('preferences');

  // Preferences form state
  const [goal, setGoal] = useState<Goal>('Hypertrophy');
  const [frequency, setFrequency] = useState<Frequency>('4-5 days / week');
  const [equipment, setEquipment] = useState<Equipment>('Commercial Gym');
  const [duration, setDuration] = useState<Duration>('45 - 60 min');
  const [notes, setNotes] = useState('');

  // Generation & preview state
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [generatedProgram, setGeneratedProgram] = useState<GeneratedProgramResult | null>(null);
  const [selectedPreviewDay, setSelectedPreviewDay] = useState<number>(0);
  const [isApplying, setIsApplying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Eligible history check
  const completedLogs = (state.logs || []).filter(
    l => l.status === 'COMPLETED' || l.status === 'PARTIALLY_COMPLETED' || l.status === 'UNSCHEDULED'
  );
  const hasEnoughHistory = completedLogs.length >= 3;

  // Reset or initialize on open
  useEffect(() => {
    if (open) {
      setStep(initialMode === 'preferences' ? 'preferences' : 'select');
      setErrorMessage('');
      setIsApplying(false);
      setLoadingMessageIndex(0);
    }
  }, [open, initialMode]);

  // Loading animation message rotator
  useEffect(() => {
    if (step !== 'loading') return;
    const interval = setInterval(() => {
      setLoadingMessageIndex(prev => (prev + 1) % LOADING_STATUS_MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [step]);

  async function handleStartGeneration(mode: 'history' | 'preferences') {
    setErrorMessage('');
    setSelectedRoute(mode);
    setStep('loading');
    setLoadingMessageIndex(0);

    try {
      const catalog = exerciseLibrary(state).map(e => ({
        id: e.id,
        name: e.name,
        muscle: e.muscle,
        equipment: e.equipment
      }));

      const payload = {
        mode,
        preferences: {
          goal,
          frequency,
          equipment,
          duration,
          notes: notes.trim().slice(0, 150)
        },
        history: mode === 'history' ? completedLogs.slice(-10).map(l => ({
          name: l.name,
          date: l.date,
          exercises: l.exercises.map(e => ({
            name: e.name,
            sets: e.sets.map(s => ({ reps: s.reps, weight: s.weight, done: s.done }))
          }))
        })) : undefined,
        catalogExercises: catalog,
        unit,
        variationSeed: Date.now()
      };

      const res = await fetch('/api/ai-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.program) {
        throw new Error(data.error || 'Failed to generate training plan.');
      }

      setGeneratedProgram(data.program);
      setSelectedPreviewDay(0);
      setStep('preview');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Generation failed. Please try again.');
      setStep(mode === 'preferences' ? 'preferences' : 'select');
    }
  }

  // Convert generated program into Cadence CycleDay format
  function convertToCadenceDays(genDays: GeneratedCycleDay[]): CycleDay[] {
    return genDays.map(d => ({
      type: 'WORKOUT',
      name: d.name,
      notes: d.notes,
      exercises: d.exercises.map(e => {
        const sets = e.sets.map((s, idx) => ({
          id: `${e.exerciseId}:set:${idx + 1}`,
          setNumber: idx + 1,
          repMin: s.repMin,
          repMax: s.repMax,
          targetWeight: s.targetWeight,
          weightUnit: unit,
          restSeconds: s.restSeconds,
          targetRpe: s.targetRpe,
          notes: s.notes
        }));
        return {
          id: uid(),
          exerciseId: e.exerciseId,
          name: e.name,
          sets,
          notes: e.notes
        };
      })
    }));
  }

  async function handleApplyActive() {
    if (!generatedProgram) return;
    try {
      setIsApplying(true);
      const days = convertToCadenceDays(generatedProgram.days);
      await onApplyActive({
        name: generatedProgram.name,
        description: generatedProgram.description,
        days
      });
      onClose();
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e?.message || 'Could not set active program.');
    } finally {
      setIsApplying(false);
    }
  }

  async function handleSaveOnly() {
    if (!generatedProgram) return;
    try {
      setIsApplying(true);
      const days = convertToCadenceDays(generatedProgram.days);
      await onSaveOnly({
        name: generatedProgram.name,
        description: generatedProgram.description,
        days
      });
      onClose();
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e?.message || 'Could not save program.');
    } finally {
      setIsApplying(false);
    }
  }

  function handleEditInEditor() {
    if (!generatedProgram) return;
    const days = convertToCadenceDays(generatedProgram.days);
    onEditInEditor({
      name: generatedProgram.name,
      description: generatedProgram.description,
      days
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={isOpen => { if (!isOpen && !isApplying) onClose(); }}>
      <DialogContent className="ai-program-modal-content max-w-xl p-0 overflow-hidden rounded-2xl border-white/60 bg-white/90 backdrop-blur-2xl shadow-2xl dark:bg-slate-900/90 dark:border-slate-800">
        <DialogTitle className="sr-only">AI Program Generator</DialogTitle>
        <DialogDescription className="sr-only">
          Generate an intelligent, progressive workout routine customized to your body and equipment.
        </DialogDescription>

        {/* Modal Top Bar (Option 1: Clean Left-Aligned Header) */}
        <div className="relative px-6 pt-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/80 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/70 dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-purple-950/20 text-left">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0 mt-0.5">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div className="text-left flex-1 min-w-0 pr-8">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Cadence AI Coach
                </h2>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 shrink-0">
                  Pro
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 text-left leading-snug">
                {step === 'select' && 'Select how you want to design your cycle'}
                {step === 'preferences' && 'Customize your 4 training dimensions'}
                {step === 'loading' && 'Structuring optimal progressive cycle'}
                {step === 'preview' && 'Review & activate your new training cycle'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="px-6 py-5 max-h-[78dvh] overflow-y-auto text-left">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <Info size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: ROUTE SELECTION */}
          {step === 'select' && (
            <div className="space-y-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-left">
                Choose your generation path:
              </p>

              {/* Option A: Based on History */}
              <div
                role="button"
                tabIndex={hasEnoughHistory ? 0 : -1}
                aria-disabled={!hasEnoughHistory}
                className={`ai-coach-card group ${
                  hasEnoughHistory
                    ? 'ai-coach-card-active'
                    : 'ai-coach-card-disabled'
                }`}
                onClick={() => {
                  if (hasEnoughHistory) {
                    handleStartGeneration('history');
                  }
                }}
                onKeyDown={(e) => {
                  if (hasEnoughHistory && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    handleStartGeneration('history');
                  }
                }}
              >
                {/* Header Row: [Icon] + Title & Badge on left, [ > ] on right */}
                <div className="ai-coach-card-header">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                      <History size={20} />
                    </div>
                    <div className="flex flex-col items-start min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 text-left">
                        From Workout History
                      </h3>
                      <div className="mt-1 flex items-center">
                        {hasEnoughHistory ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                            <Check size={11} className="shrink-0 stroke-[2.5]" /> {completedLogs.length} logged workouts
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100/90 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                            <Lock size={10} className="shrink-0" /> Requires 3+ logs
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 pt-0.5 text-slate-400">
                    <ChevronRight size={18} />
                  </div>
                </div>

                {/* Card Body Text: Strict left alignment matching title */}
                <div className="ai-coach-card-body pl-[52px]">
                  <p className="text-xs text-slate-600 dark:text-slate-400 text-left leading-relaxed">
                    Auto-progression based on your past exercises, weights, and volume.
                  </p>

                  {!hasEnoughHistory && (
                    <div className="ai-coach-notice-box">
                      <div className="flex items-start gap-2">
                        <Info size={14} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                        <div className="text-[11px] leading-snug text-left">
                          <div className="font-semibold text-amber-900 dark:text-amber-200">
                            Need at least 3 logged workouts
                          </div>
                          <div className="text-amber-700/90 dark:text-amber-400/90">
                            to analyze progression.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Option B: Based on Preferences */}
              <div
                role="button"
                tabIndex={0}
                className="ai-coach-card ai-coach-card-active group"
                onClick={() => setStep('preferences')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setStep('preferences');
                  }
                }}
              >
                {/* Header Row: [Icon] + Title & Badge on left, [ > ] on right */}
                <div className="ai-coach-card-header">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                      <SlidersHorizontal size={20} />
                    </div>
                    <div className="flex flex-col items-start min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 text-left">
                        From Preferences
                      </h3>
                      <div className="mt-1 flex items-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40">
                          <Zap size={10} className="shrink-0 fill-current" /> 4 Quick Chips
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 pt-0.5 text-slate-400">
                    <ChevronRight size={18} />
                  </div>
                </div>

                {/* Card Body Text: Strict left alignment matching title */}
                <div className="ai-coach-card-body pl-[52px]">
                  <p className="text-xs text-slate-600 dark:text-slate-400 text-left leading-relaxed">
                    Customize goal, training frequency, equipment, and session length.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PREFERENCES FORM */}
          {step === 'preferences' && (
            <div className="space-y-5">
              {/* Field 1: Primary Goal */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <span>1. Primary Goal</span>
                  <span className="text-[11px] font-normal text-blue-600 dark:text-blue-400">{goal}</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {GOAL_OPTIONS.map(opt => {
                    const Icon = opt.icon;
                    const isSelected = goal === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setGoal(opt.value)}
                        className={`p-3 rounded-xl text-left border transition-all flex flex-col gap-1 min-h-[48px] ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                            : 'bg-white/80 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon size={15} className={isSelected ? 'text-white' : 'text-blue-600 dark:text-blue-400'} />
                          <span className="text-xs font-bold">{opt.label}</span>
                        </div>
                        <span className={`text-[10px] line-clamp-1 ${isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                          {opt.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Field 2: Weekly Frequency */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <span>2. Weekly Frequency</span>
                  <span className="text-[11px] font-normal text-blue-600 dark:text-blue-400">{frequency}</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {FREQUENCY_OPTIONS.map(opt => {
                    const isSelected = frequency === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFrequency(opt.value)}
                        className={`p-2.5 rounded-xl text-center border transition-all flex flex-col items-center justify-center min-h-[48px] ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                            : 'bg-white/80 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-xs font-bold">{opt.label}</span>
                        <span className={`text-[9px] mt-0.5 line-clamp-1 ${isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                          {opt.sub}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Field 3: Available Equipment */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <span>3. Available Equipment</span>
                  <span className="text-[11px] font-normal text-blue-600 dark:text-blue-400">{equipment}</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {EQUIPMENT_OPTIONS.map(opt => {
                    const isSelected = equipment === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setEquipment(opt.value)}
                        className={`p-2.5 rounded-xl text-center border transition-all flex flex-col items-center justify-center min-h-[48px] ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                            : 'bg-white/80 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-xs font-bold">{opt.label}</span>
                        <span className={`text-[9px] mt-0.5 line-clamp-1 ${isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                          {opt.sub}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Field 4: Target Session Duration */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <span>4. Target Session Duration</span>
                  <span className="text-[11px] font-normal text-blue-600 dark:text-blue-400">{duration}</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {DURATION_OPTIONS.map(opt => {
                    const isSelected = duration === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setDuration(opt.value)}
                        className={`p-2.5 rounded-xl text-center border transition-all flex flex-col items-center justify-center min-h-[48px] ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                            : 'bg-white/80 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-xs font-bold">{opt.label}</span>
                        <span className={`text-[9px] mt-0.5 line-clamp-1 ${isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                          {opt.sub}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Field: Custom Notes / Restrictions */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Custom Notes / Restrictions <span className="font-normal text-slate-400">(Optional)</span>
                  </label>
                  <span className="text-[10px] text-slate-400">{notes.length}/150</span>
                </div>
                <input
                  type="text"
                  maxLength={150}
                  placeholder='e.g. "Avoid overhead pressing due to shoulder impingement" or "Focus on glutes"'
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Navigation CTA */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep('select')}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => handleStartGeneration('preferences')}
                  className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles size={16} />
                  <span>Generate Cycle with AI</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: LOADING SKELETON / SPINNER */}
          {step === 'loading' && (
            <div className="py-12 px-4 text-center space-y-6">
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-900/40 border-t-blue-600 animate-spin" />
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Sparkles size={22} className="animate-pulse" />
                </div>
              </div>

              <div className="space-y-2 max-w-sm mx-auto">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 transition-all duration-300">
                  {LOADING_STATUS_MESSAGES[loadingMessageIndex]}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cadence AI is tailoring your exercise cadence, working sets, and recovery targets...
                </p>
              </div>

              {/* Skeleton cards preview */}
              <div className="grid grid-cols-2 gap-2.5 max-w-sm mx-auto opacity-40 animate-pulse pt-2">
                <div className="h-16 rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="h-16 rounded-xl bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          )}

          {/* STEP 4: PREVIEW GENERATED PROGRAM */}
          {step === 'preview' && generatedProgram && (
            <div className="space-y-4">
              {/* Program Overview Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-200/60 dark:border-blue-800/40 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-600 text-white">
                    {selectedRoute === 'history' ? 'History-Optimized' : goal}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {generatedProgram.days.length} Workouts per Cycle
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {generatedProgram.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {generatedProgram.description}
                </p>
                {generatedProgram.rationale && (
                  <p className="text-[11px] text-blue-700 dark:text-blue-300 italic pt-1 border-t border-blue-200/40 dark:border-blue-900/40">
                    💡 {generatedProgram.rationale}
                  </p>
                )}
              </div>

              {/* Day Switcher Tabs */}
              <div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {generatedProgram.days.map((day, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedPreviewDay(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                        selectedPreviewDay === idx
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      Day {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Day Workout Details */}
              {generatedProgram.days[selectedPreviewDay] && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        {generatedProgram.days[selectedPreviewDay].name}
                      </h4>
                      {generatedProgram.days[selectedPreviewDay].notes && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {generatedProgram.days[selectedPreviewDay].notes}
                        </p>
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {generatedProgram.days[selectedPreviewDay].exercises.length} Exercises
                    </span>
                  </div>

                  {/* Exercises list */}
                  <div className="space-y-2">
                    {generatedProgram.days[selectedPreviewDay].exercises.map((ex, exIdx) => {
                      const setsCount = ex.sets.length;
                      const repSummary = ex.sets.map(s => s.repMin === s.repMax ? `${s.repMin}` : `${s.repMin}–${s.repMax}`).join(' / ');
                      const restSummary = `${ex.sets[0]?.restSeconds || 90}s rest`;

                      return (
                        <div
                          key={ex.exerciseId + exIdx}
                          className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold flex items-center justify-center">
                                {exIdx + 1}
                              </span>
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                {ex.name}
                              </span>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                              {setsCount} sets · {repSummary} reps
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400 pl-7">
                            <span>⏱ Rest: {restSummary}</span>
                            {ex.sets[0]?.targetRpe && <span>🎯 RPE {ex.sets[0].targetRpe}</span>}
                            {ex.sets[0]?.targetWeight && <span>⚖️ ~{ex.sets[0].targetWeight} {unit}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="pt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStartGeneration(selectedRoute)}
                    disabled={isApplying}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RotateCcw size={14} />
                    <span>Regenerate</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleEditInEditor}
                    disabled={isApplying}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit3 size={14} />
                    <span>Edit in Program Editor</span>
                  </button>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleApplyActive}
                    disabled={isApplying}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <Check size={16} />
                    <span>{isApplying ? 'Activating Cycle...' : 'Apply to Schedule / Set as Active'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveOnly}
                    disabled={isApplying}
                    className="w-full py-2.5 text-center text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  >
                    Save to My Programs without activating
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
