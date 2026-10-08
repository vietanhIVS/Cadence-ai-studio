import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export interface AIProgramRequest {
  mode: 'preferences' | 'history';
  preferences?: {
    goal: 'Hypertrophy' | 'Strength' | 'Fat Loss' | 'General Fitness';
    frequency: '2-3 days / week' | '4-5 days / week' | '6 days / week';
    equipment: 'Commercial Gym' | 'Dumbbells Only / Home Gym' | 'Bodyweight / Calisthenics';
    duration: '30 - 45 min' | '45 - 60 min' | '60 - 90 min';
    notes?: string;
  };
  history?: Array<{
    name: string;
    date: string;
    exercises: Array<{
      name: string;
      sets: Array<{ reps: number | null; weight: number | null; done: boolean }>;
    }>;
  }>;
  catalogExercises?: Array<{
    id: string;
    name: string;
    muscle: string;
    equipment: string;
  }>;
  unit?: 'kg' | 'lb';
  variationSeed?: number;
}

export interface GeneratedPlanSet {
  setNumber: number;
  repMin: number;
  repMax: number;
  targetWeight?: number;
  restSeconds: number;
  targetRpe?: number;
  notes?: string;
}

export interface GeneratedPlanExercise {
  exerciseId: string;
  name: string;
  sets: GeneratedPlanSet[];
  notes?: string;
}

export interface GeneratedCycleDay {
  type: 'WORKOUT';
  name: string;
  notes?: string;
  exercises: GeneratedPlanExercise[];
}

export interface GeneratedProgramResult {
  name: string;
  description: string;
  days: GeneratedCycleDay[];
  rationale?: string;
}

// Built-in default exercise fallback bank
const DEFAULT_CATALOG = [
  { id: 'bench', name: 'Bench Press', muscle: 'Chest', equipment: 'Barbell' },
  { id: 'incline', name: 'Incline Dumbbell Press', muscle: 'Chest', equipment: 'Dumbbell' },
  { id: 'fly', name: 'Cable Fly', muscle: 'Chest', equipment: 'Cable' },
  { id: 'pushup', name: 'Push-up', muscle: 'Chest', equipment: 'Bodyweight' },
  { id: 'dip', name: 'Triceps Dip', muscle: 'Arms', equipment: 'Bodyweight' },
  { id: 'ohp', name: 'Overhead Press', muscle: 'Shoulders', equipment: 'Barbell' },
  { id: 'lateral', name: 'Lateral Raise', muscle: 'Shoulders', equipment: 'Dumbbell' },
  { id: 'rear_delt', name: 'Face Pull', muscle: 'Shoulders', equipment: 'Cable' },
  { id: 'triceps', name: 'Triceps Pushdown', muscle: 'Arms', equipment: 'Cable' },
  { id: 'pullup', name: 'Pull-up', muscle: 'Back', equipment: 'Bodyweight' },
  { id: 'pulldown', name: 'Lat Pulldown', muscle: 'Back', equipment: 'Cable' },
  { id: 'row', name: 'Barbell Row', muscle: 'Back', equipment: 'Barbell' },
  { id: 'db_row', name: 'Single-Arm Dumbbell Row', muscle: 'Back', equipment: 'Dumbbell' },
  { id: 'seatedrow', name: 'Seated Cable Row', muscle: 'Back', equipment: 'Cable' },
  { id: 'curl', name: 'Biceps Curl', muscle: 'Arms', equipment: 'Dumbbell' },
  { id: 'hammer_curl', name: 'Hammer Curl', muscle: 'Arms', equipment: 'Dumbbell' },
  { id: 'squat', name: 'Back Squat', muscle: 'Legs', equipment: 'Barbell' },
  { id: 'goblet_squat', name: 'Goblet Squat', muscle: 'Legs', equipment: 'Dumbbell' },
  { id: 'rdl', name: 'Romanian Deadlift', muscle: 'Legs', equipment: 'Barbell' },
  { id: 'db_rdl', name: 'Dumbbell Romanian Deadlift', muscle: 'Legs', equipment: 'Dumbbell' },
  { id: 'legpress', name: 'Leg Press', muscle: 'Legs', equipment: 'Machine' },
  { id: 'legcurl', name: 'Leg Curl', muscle: 'Legs', equipment: 'Machine' },
  { id: 'lunge', name: 'Walking Lunge', muscle: 'Legs', equipment: 'Dumbbell' },
  { id: 'calf', name: 'Calf Raise', muscle: 'Legs', equipment: 'Machine' },
  { id: 'deadlift', name: 'Deadlift', muscle: 'Back', equipment: 'Barbell' },
  { id: 'plank', name: 'Plank', muscle: 'Core', equipment: 'Bodyweight' },
  { id: 'crunch', name: 'Cable Crunch', muscle: 'Core', equipment: 'Cable' },
  { id: 'leg_raise', name: 'Hanging Leg Raise', muscle: 'Core', equipment: 'Bodyweight' }
];

const PROGRAM_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    description: { type: Type.STRING },
    rationale: { type: Type.STRING },
    days: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          name: { type: Type.STRING },
          notes: { type: Type.STRING },
          exercises: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                exerciseId: { type: Type.STRING },
                name: { type: Type.STRING },
                notes: { type: Type.STRING },
                sets: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      setNumber: { type: Type.INTEGER },
                      repMin: { type: Type.INTEGER },
                      repMax: { type: Type.INTEGER },
                      restSeconds: { type: Type.INTEGER },
                      targetRpe: { type: Type.NUMBER },
                      targetWeight: { type: Type.NUMBER },
                      notes: { type: Type.STRING }
                    },
                    required: ['setNumber', 'repMin', 'repMax', 'restSeconds']
                  }
                }
              },
              required: ['exerciseId', 'name', 'sets']
            }
          }
        },
        required: ['type', 'name', 'exercises']
      }
    }
  },
  required: ['name', 'description', 'days']
};

function sanitizeProgram(
  raw: any,
  catalog: Array<{ id: string; name: string; muscle: string; equipment: string }>,
  _unit: 'kg' | 'lb' = 'kg'
): GeneratedProgramResult {
  const safeCatalog = catalog.length > 0 ? catalog : DEFAULT_CATALOG;
  const findClosestExercise = (queryName: string, idHint?: string) => {
    if (idHint) {
      const matchId = safeCatalog.find(c => c.id.toLowerCase() === idHint.toLowerCase());
      if (matchId) return matchId;
    }
    const cleanQuery = (queryName || '').toLowerCase().trim();
    const exactName = safeCatalog.find(c => c.name.toLowerCase() === cleanQuery);
    if (exactName) return exactName;
    const partialName = safeCatalog.find(c =>
      c.name.toLowerCase().includes(cleanQuery) || cleanQuery.includes(c.name.toLowerCase())
    );
    if (partialName) return partialName;
    return safeCatalog[0];
  };

  const name = typeof raw?.name === 'string' && raw.name.trim()
    ? raw.name.trim().slice(0, 80)
    : typeof raw?.cycleName === 'string' && raw.cycleName.trim()
    ? raw.cycleName.trim().slice(0, 80)
    : typeof raw?.title === 'string' && raw.title.trim()
    ? raw.title.trim().slice(0, 80)
    : 'AI Generated Training Cycle';

  const description = typeof raw?.description === 'string' && raw.description.trim()
    ? raw.description.trim().slice(0, 300)
    : typeof raw?.summary === 'string' && raw.summary.trim()
    ? raw.summary.trim().slice(0, 300)
    : 'Personalized training cycle structured by Cadence AI.';

  const rawDays = Array.isArray(raw?.days) && raw.days.length > 0
    ? raw.days
    : Array.isArray(raw?.schedule) && raw.schedule.length > 0
    ? raw.schedule
    : Array.isArray(raw?.workouts) && raw.workouts.length > 0
    ? raw.workouts
    : [];

  const days: GeneratedCycleDay[] = rawDays.slice(0, 7).map((d: any, dayIdx: number) => {
    const dayName = typeof d?.name === 'string' && d.name.trim()
      ? d.name.trim().slice(0, 50)
      : typeof d?.focus === 'string' && d.focus.trim()
      ? `Day ${dayIdx + 1}: ${d.focus.trim().slice(0, 40)}`
      : typeof d?.title === 'string' && d.title.trim()
      ? d.title.trim().slice(0, 50)
      : `Workout ${dayIdx + 1}`;

    const dayNotes = typeof d?.notes === 'string' && d.notes.trim() ? d.notes.trim().slice(0, 200) : undefined;
    const rawExercises = Array.isArray(d?.exercises) && d.exercises.length > 0
      ? d.exercises
      : Array.isArray(d?.movements) && d.movements.length > 0
      ? d.movements
      : [];

    const exercises: GeneratedPlanExercise[] = rawExercises.slice(0, 10).map((e: any) => {
      const catalogMatch = findClosestExercise(e.name || e.exerciseName || '', e.exerciseId || e.id);
      const rawSets = Array.isArray(e?.sets) && e.sets.length > 0 ? e.sets : [{}, {}, {}];

      const sets: GeneratedPlanSet[] = rawSets.slice(0, 8).map((s: any, sIdx: number) => {
        const repMin = Math.max(1, Math.min(50, Number(s.repMin) || 8));
        const repMax = Math.max(repMin, Math.min(50, Number(s.repMax) || repMin || 12));
        const restSeconds = Math.max(30, Math.min(300, Number(s.restSeconds) || 90));
        const targetRpe = s.targetRpe ? Math.max(6, Math.min(10, Number(s.targetRpe))) : undefined;
        const targetWeight = Number(s.targetWeight) > 0 ? Math.round(Number(s.targetWeight) * 10) / 10 : undefined;

        return {
          setNumber: sIdx + 1,
          repMin,
          repMax,
          ...(targetWeight !== undefined ? { targetWeight } : {}),
          restSeconds,
          ...(targetRpe !== undefined ? { targetRpe } : {}),
          ...(typeof s.notes === 'string' && s.notes.trim() ? { notes: s.notes.trim().slice(0, 100) } : {})
        };
      });

      return {
        exerciseId: catalogMatch.id,
        name: catalogMatch.name,
        sets,
        ...(typeof e.notes === 'string' && e.notes.trim() ? { notes: e.notes.trim().slice(0, 150) } : {})
      };
    });

    return {
      type: 'WORKOUT',
      name: dayName,
      ...(dayNotes ? { notes: dayNotes } : {}),
      exercises: exercises.length > 0 ? exercises : [{
        exerciseId: safeCatalog[0].id,
        name: safeCatalog[0].name,
        sets: [
          { setNumber: 1, repMin: 8, repMax: 12, restSeconds: 90 },
          { setNumber: 2, repMin: 8, repMax: 12, restSeconds: 90 },
          { setNumber: 3, repMin: 8, repMax: 12, restSeconds: 90 }
        ]
      }]
    };
  });

  return {
    name,
    description,
    days: days.length > 0 ? days : [
      {
        type: 'WORKOUT',
        name: 'Day 1: Full Body Foundations',
        exercises: [
          {
            exerciseId: 'squat',
            name: 'Back Squat',
            sets: [
              { setNumber: 1, repMin: 6, repMax: 8, restSeconds: 120, targetRpe: 7.5 },
              { setNumber: 2, repMin: 6, repMax: 8, restSeconds: 120, targetRpe: 8 },
              { setNumber: 3, repMin: 6, repMax: 8, restSeconds: 120, targetRpe: 8.5 }
            ]
          },
          {
            exerciseId: 'bench',
            name: 'Bench Press',
            sets: [
              { setNumber: 1, repMin: 6, repMax: 8, restSeconds: 120, targetRpe: 7.5 },
              { setNumber: 2, repMin: 6, repMax: 8, restSeconds: 120, targetRpe: 8 },
              { setNumber: 3, repMin: 6, repMax: 8, restSeconds: 120, targetRpe: 8.5 }
            ]
          },
          {
            exerciseId: 'row',
            name: 'Barbell Row',
            sets: [
              { setNumber: 1, repMin: 8, repMax: 12, restSeconds: 90, targetRpe: 8 },
              { setNumber: 2, repMin: 8, repMax: 12, restSeconds: 90, targetRpe: 8 },
              { setNumber: 3, repMin: 8, repMax: 12, restSeconds: 90, targetRpe: 8.5 }
            ]
          }
        ]
      }
    ],
    rationale: typeof raw?.rationale === 'string' ? raw.rationale.slice(0, 250) : undefined
  };
}

// Helper to shuffle arrays with optional random seed
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Fallback high-quality heuristic program generator in case AI key is missing or offline
function generateFallbackProgram(
  body: AIProgramRequest,
  catalog: Array<{ id: string; name: string; muscle: string; equipment: string }>
): GeneratedProgramResult {
  const _unit = body.unit || 'kg';
  const goal = body.preferences?.goal || 'Hypertrophy';
  const frequency = body.preferences?.frequency || '4-5 days / week';
  const equipment = body.preferences?.equipment || 'Commercial Gym';
  const duration = body.preferences?.duration || '45 - 60 min';

  const safeCatalog = catalog.length > 0 ? catalog : DEFAULT_CATALOG;

  // Filter catalog based on equipment
  const equipmentFiltered = safeCatalog.filter(e => {
    if (equipment === 'Bodyweight / Calisthenics') {
      return e.equipment === 'Bodyweight';
    }
    if (equipment === 'Dumbbells Only / Home Gym') {
      return e.equipment === 'Dumbbell' || e.equipment === 'Bodyweight';
    }
    return true; // Commercial Gym gets all
  });

  const pool = equipmentFiltered.length >= 4 ? equipmentFiltered : safeCatalog;

  // Goal tuning
  let repMin = 8;
  let repMax = 12;
  let defaultRest = 90;
  let targetRpe = 8;

  if (goal === 'Strength') {
    repMin = 4;
    repMax = 6;
    defaultRest = 150;
    targetRpe = 8.5;
  } else if (goal === 'Fat Loss') {
    repMin = 12;
    repMax = 15;
    defaultRest = 60;
    targetRpe = 7.5;
  } else if (goal === 'General Fitness') {
    repMin = 8;
    repMax = 12;
    defaultRest = 75;
    targetRpe = 8;
  }

  // Target exercise count per workout based on duration
  const exerciseCount = duration.includes('30') ? 3 : duration.includes('60 - 90') ? 6 : 4;

  // History mode fallback: derives program directly from the user's logged movements
  if (body.mode === 'history' && body.history && body.history.length >= 3) {
    const recentLogs = body.history.slice(-8);
    const exerciseHistoryMap = new Map<string, { lastWeight: number; lastReps: number; count: number }>();

    for (const log of recentLogs) {
      for (const ex of log.exercises) {
        const completed = ex.sets.filter(s => s.done && s.weight && s.weight > 0);
        if (completed.length > 0) {
          const maxWeight = Math.max(...completed.map(s => Number(s.weight) || 0));
          const maxReps = Math.max(...completed.map(s => Number(s.reps) || 0));
          const existing = exerciseHistoryMap.get(ex.name.toLowerCase());
          exerciseHistoryMap.set(ex.name.toLowerCase(), {
            lastWeight: maxWeight || existing?.lastWeight || 0,
            lastReps: maxReps || existing?.lastReps || 8,
            count: (existing?.count || 0) + 1
          });
        }
      }
    }

    // Match historical exercises with catalog
    const matchedExercises = pool.filter(e => exerciseHistoryMap.has(e.name.toLowerCase()));
    const otherExercises = pool.filter(e => !exerciseHistoryMap.has(e.name.toLowerCase()));

    const daysCount = frequency === '2-3 days / week' ? 3 : frequency === '6 days / week' ? 5 : 4;
    const days: GeneratedCycleDay[] = [];

    const dayLabels = [
      'Day 1: Compound Overload & Push Focus',
      'Day 2: Posterior Chain & Pull Strength',
      'Day 3: Lower Body Power & Core Stabilization',
      'Day 4: Upper Dynamic Volume & Conditioning',
      'Day 5: Full Body Capacity & Core'
    ];

    for (let d = 0; d < daysCount; d++) {
      const dayExercises: GeneratedPlanExercise[] = [];
      const dayPool = shuffleArray([...matchedExercises, ...otherExercises]);
      const selected = dayPool.slice(0, exerciseCount);

      for (const item of selected) {
        const historyData = exerciseHistoryMap.get(item.name.toLowerCase());
        const progressedWeight = historyData?.lastWeight
          ? Math.round((historyData.lastWeight * 1.025) * 10) / 10
          : undefined;

        dayExercises.push({
          exerciseId: item.id,
          name: item.name,
          sets: [
            { setNumber: 1, repMin, repMax, targetWeight: progressedWeight, restSeconds: defaultRest, targetRpe },
            { setNumber: 2, repMin, repMax, targetWeight: progressedWeight, restSeconds: defaultRest, targetRpe },
            { setNumber: 3, repMin, repMax, targetWeight: progressedWeight, restSeconds: defaultRest, targetRpe: Math.min(10, targetRpe + 0.5) }
          ]
        });
      }

      days.push({
        type: 'WORKOUT',
        name: dayLabels[d] || `Day ${d + 1}: Targeted Progression`,
        notes: `Focus on progressive overload and explosive concentric phase.`,
        exercises: dayExercises
      });
    }

    return {
      name: `Adaptive Progression Cycle (${recentLogs.length} Sessions Analyzed)`,
      description: `Periodized progressive cycle generated from your logged movement volume with calibrated load progressions.`,
      rationale: `Prioritizes your frequently trained compound lifts while advancing target loads by +2.5% to ensure sustained progressive overload.`,
      days
    };
  }

  // Preferences mode fallback: intelligent procedural generation
  const chestAndShoulders = pool.filter(e => e.muscle === 'Chest' || e.muscle === 'Shoulders');
  const backAndArms = pool.filter(e => e.muscle === 'Back' || e.muscle === 'Arms');
  const legsAndCore = pool.filter(e => e.muscle === 'Legs' || e.muscle === 'Core');

  const titles = [
    `${goal} Progression Blueprint`,
    `Optimal ${goal} Split`,
    `Dynamic ${goal} Performance Cycle`,
    `Precision ${goal} Architecture`
  ];
  const programName = titles[Math.floor(Math.random() * titles.length)];

  if (frequency === '2-3 days / week') {
    // 3 Full Body workouts with varied emphasis
    const makeDay = (dayName: string, notes: string, primaryPool: typeof pool, secPool1: typeof pool, secPool2: typeof pool): GeneratedCycleDay => {
      const picks = [
        ...shuffleArray(primaryPool).slice(0, 2),
        ...shuffleArray(secPool1).slice(0, Math.max(1, Math.floor(exerciseCount / 2))),
        ...shuffleArray(secPool2).slice(0, Math.max(1, Math.ceil(exerciseCount / 2) - 1))
      ].slice(0, exerciseCount);

      return {
        type: 'WORKOUT',
        name: dayName,
        notes,
        exercises: picks.map(ex => ({
          exerciseId: ex.id,
          name: ex.name,
          sets: [
            { setNumber: 1, repMin, repMax, restSeconds: defaultRest, targetRpe },
            { setNumber: 2, repMin, repMax, restSeconds: defaultRest, targetRpe },
            { setNumber: 3, repMin, repMax, restSeconds: defaultRest, targetRpe: Math.min(10, targetRpe + 0.5) }
          ]
        }))
      };
    };

    return {
      name: programName,
      description: `High-frequency full-body routine calibrated for ${equipment.toLowerCase()} and ${duration} sessions.`,
      rationale: `Evenly stimulates major muscle groups across 3 weekly sessions with 48h rest windows for maximum muscular recovery.`,
      days: [
        makeDay('Day 1: Full Body (Squat & Press Bias)', 'Drive tension through the floor and control the negative.', legsAndCore, chestAndShoulders, backAndArms),
        makeDay('Day 2: Full Body (Hinge & Pull Bias)', 'Keep thoracic spine neutral during pulling and deadlift patterns.', backAndArms, legsAndCore, chestAndShoulders),
        makeDay('Day 3: Full Body (Compound Density & Core)', 'Finish with controlled tempo and solid midsection bracing.', chestAndShoulders, backAndArms, legsAndCore)
      ]
    };
  }

  if (frequency === '6 days / week') {
    // 6-day Push / Pull / Legs x 2
    const makeSplitDay = (name: string, focusPool: typeof pool, notes: string): GeneratedCycleDay => {
      const picks = shuffleArray(focusPool).slice(0, exerciseCount);
      const safePicks = picks.length > 0 ? picks : shuffleArray(pool).slice(0, exerciseCount);
      return {
        type: 'WORKOUT',
        name,
        notes,
        exercises: safePicks.map(ex => ({
          exerciseId: ex.id,
          name: ex.name,
          sets: [
            { setNumber: 1, repMin, repMax, restSeconds: defaultRest, targetRpe },
            { setNumber: 2, repMin, repMax, restSeconds: defaultRest, targetRpe },
            { setNumber: 3, repMin, repMax, restSeconds: defaultRest, targetRpe: Math.min(10, targetRpe + 0.5) }
          ]
        }))
      };
    };

    return {
      name: programName,
      description: `High-frequency 6-day split maximizing weekly training volume for ${equipment.toLowerCase()}.`,
      rationale: `Distributes volume evenly across two weekly microcycles for each movement pattern to avoid excessive localized fatigue.`,
      days: [
        makeSplitDay('Day 1: Push A (Chest & Delts Focus)', chestAndShoulders, 'Strict tempo on horizontal pressing.'),
        makeSplitDay('Day 2: Pull A (Lats & Upper Back Focus)', backAndArms, 'Focus on deep stretch at the bottom.'),
        makeSplitDay('Day 3: Legs A (Quad & Knee Flexion Focus)', legsAndCore, 'Full range of motion on knee-dominant work.'),
        makeSplitDay('Day 4: Push B (Shoulders & Triceps Focus)', chestAndShoulders, 'Maintain scapular positioning.'),
        makeSplitDay('Day 5: Pull B (Back Thickness & Biceps Focus)', backAndArms, 'Squeeze scapulae at full contraction.'),
        makeSplitDay('Day 6: Legs B (Posterior Chain & Core Focus)', legsAndCore, 'Hinge at the hips with braced abdominal wall.')
      ]
    };
  }

  // Default: 4-day Upper / Lower or Push / Pull split
  const make4Day = (name: string, focusPool: typeof pool, notes: string): GeneratedCycleDay => {
    const picks = shuffleArray(focusPool).slice(0, exerciseCount);
    const safePicks = picks.length >= 2 ? picks : shuffleArray(pool).slice(0, exerciseCount);
    return {
      type: 'WORKOUT',
      name,
      notes,
      exercises: safePicks.map(ex => ({
        exerciseId: ex.id,
        name: ex.name,
        sets: [
          { setNumber: 1, repMin, repMax, restSeconds: defaultRest, targetRpe },
          { setNumber: 2, repMin, repMax, restSeconds: defaultRest, targetRpe },
          { setNumber: 3, repMin, repMax, restSeconds: defaultRest, targetRpe: Math.min(10, targetRpe + 0.5) }
        ]
      }))
    };
  };

  const upperPool = pool.filter(e => e.muscle === 'Chest' || e.muscle === 'Back' || e.muscle === 'Shoulders' || e.muscle === 'Arms');
  const lowerPool = pool.filter(e => e.muscle === 'Legs' || e.muscle === 'Core');

  return {
    name: programName,
    description: `Structured 4-day progressive training cycle tailored to ${goal.toLowerCase()} with ${equipment.toLowerCase()}.`,
    rationale: `Optimal balance of frequency and recovery allowing 2 targeted exposures per muscle group weekly.`,
    days: [
      make4Day('Day 1: Upper Power & Pressing', upperPool, 'Prioritize compound pressing and rowing strength.'),
      make4Day('Day 2: Lower Power & Squat Emphasis', lowerPool, 'Build foundation on knee-dominant movements and core brace.'),
      make4Day('Day 3: Upper Hypertrophy & Pull Emphasis', upperPool, 'High mind-muscle connection and controlled eccentrics.'),
      make4Day('Day 4: Lower Hypertrophy & Hinge Emphasis', lowerPool, 'Posterior chain loading with hamstring and glute recruitment.')
    ]
  };
}

export async function POST(req: NextRequest) {
  let body: AIProgramRequest;
  try {
    body = await req.json();
  } catch (_e) {
    body = { mode: 'preferences' };
  }

  const rawCatalog = Array.isArray(body.catalogExercises) && body.catalogExercises.length > 0
    ? body.catalogExercises
    : DEFAULT_CATALOG;
  const unit = body.unit || 'kg';
  const apiKey = process.env.GEMINI_API_KEY;

  // Filter catalog by equipment if in preferences mode
  const equipment = body.preferences?.equipment;
  let catalog = rawCatalog;
  if (body.mode === 'preferences' && equipment) {
    if (equipment.toLowerCase().includes('bodyweight') || equipment.toLowerCase().includes('calisthenic')) {
      const bw = rawCatalog.filter(e => e.equipment?.toLowerCase() === 'bodyweight');
      if (bw.length >= 4) catalog = bw;
    } else if (equipment.toLowerCase().includes('dumbbell')) {
      const db = rawCatalog.filter(e => e.equipment?.toLowerCase() === 'dumbbell' || e.equipment?.toLowerCase() === 'bodyweight');
      if (db.length >= 4) catalog = db;
    }
  }

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      // Construct prompt based on mode
      let userPrompt = '';
      const catalogSummary = catalog.map(c => `- ${c.name} (id: "${c.id}", muscle: "${c.muscle}", equip: "${c.equipment}")`).join('\n');
      const seed = body.variationSeed || Date.now();

      if (body.mode === 'history' && body.history && body.history.length > 0) {
        const historySummary = body.history.slice(-10).map((h, i) => {
          const exSummary = h.exercises.map(e => {
            const completedSets = e.sets.filter(s => s.done);
            const repsWeights = completedSets.map(s => `${s.reps || 0}r @ ${s.weight || 0}${unit}`).join(', ');
            return `  * ${e.name}: ${completedSets.length} sets completed (${repsWeights || 'bodyweight'})`;
          }).join('\n');
          return `Workout ${i + 1} (${h.name} on ${h.date}):\n${exSummary}`;
        }).join('\n\n');

        userPrompt = `You are an elite strength & conditioning coach and exercise physiologist.
A lifter has recorded their workout history in Cadence and wants you to design their NEXT PROGRESSIVE TRAINING CYCLE.

RECENT WORKOUT HISTORY:
${historySummary}

OPTIONAL USER NOTES / CONSTRAINTS:
${body.preferences?.notes || 'None specified'}

AVAILABLE EXERCISE CATALOG (Select exercises from this list and use their exact id and name):
${catalogSummary}

INSTRUCTIONS:
1. Analyze their historical volume, exercise selection, and progression patterns.
2. Structure a repeating cycle of 2 to 5 distinct workout days (e.g. Day 1: Upper Strength, Day 2: Lower Hypertrophy, etc.).
3. Each workout day should have 3 to 6 exercises with 2 to 4 planned sets each.
4. For each set, provide setNumber, repMin, repMax, restSeconds, targetRpe, and realistic targetWeight in ${unit} slightly progressed from recent performance if known.
5. Seed / Variation: ${seed}. Provide a fresh, customized training program.`;
      } else {
        const { goal, frequency, equipment, duration, notes } = body.preferences || {
          goal: 'Hypertrophy',
          frequency: '4-5 days / week',
          equipment: 'Commercial Gym',
          duration: '45 - 60 min',
          notes: ''
        };

        const daysCountHint = frequency === '2-3 days / week' ? '2 to 3 days' : frequency === '6 days / week' ? '5 to 6 days' : '3 to 4 days';
        const exercisesCountHint = duration.includes('30') ? '3 to 4 exercises' : duration.includes('60 - 90') ? '5 to 7 exercises' : '4 to 6 exercises';

        userPrompt = `You are an elite strength & conditioning coach and exercise physiologist.
Create a custom training cycle tailored to the user's specific training parameters:

USER PARAMETERS:
- Primary Goal: ${goal}
- Weekly Frequency: ${frequency} (Program ${daysCountHint} in this cycle)
- Available Equipment: ${equipment}
- Target Session Duration: ${duration} (Program ${exercisesCountHint} per workout)
- Custom Notes / Health Constraints: ${notes || 'None'}
- Unit Preference: ${unit}
- Session Random Seed: ${seed}

AVAILABLE EXERCISE CATALOG (You MUST select exercises from this list and use their exact id and name):
${catalogSummary}

INSTRUCTIONS:
1. Design an effective split matching the equipment, frequency, and duration.
2. Ensure muscle groups are balanced with sensible recovery windows.
3. Every exercise must use an exact "exerciseId" and "name" from the provided catalog.
4. Each set must have setNumber, repMin, repMax, restSeconds, and optional targetRpe.
5. Create a unique, creative plan name and detailed descriptions. Avoid repeating default split patterns identically.`;
      }

      // Candidate models for high availability and low latency:
      // gemini-3.1-flash-lite is fastest and highly available; gemini-3.8-flash is fallback
      const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
      let lastModelError: any = null;

      for (const model of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: userPrompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: PROGRAM_RESPONSE_SCHEMA,
              temperature: 0.85,
              systemInstruction: `You are the master coach engine for Cadence workout planner. Always return clean valid JSON matching the schema. Structure varied, scientifically sound, progressive routines.`
            }
          });

          const text = response.text?.trim() || '';
          if (text) {
            let parsed: any;
            try {
              parsed = JSON.parse(text);
            } catch {
              const cleaned = text.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();
              parsed = JSON.parse(cleaned);
            }

            if (parsed && (parsed.name || parsed.cycleName || parsed.title) && (parsed.days || parsed.schedule || parsed.workouts)) {
              const sanitized = sanitizeProgram(parsed, catalog, unit);
              return NextResponse.json({ program: sanitized });
            }
          }
        } catch (modelError: any) {
          console.warn(`Model ${model} failed, trying next candidate:`, modelError?.message || modelError);
          lastModelError = modelError;
        }
      }

      console.warn("All candidate Gemini models failed or unavailable:", lastModelError?.message);
    } catch (aiOuterError: any) {
      console.warn("Outer AI generation error:", aiOuterError?.message);
    }
  }

  // Dynamic rule-based fallback generator
  try {
    const fallback = generateFallbackProgram(body, catalog);
    return NextResponse.json({ program: fallback });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to generate training program.' },
      { status: 500 }
    );
  }
}
