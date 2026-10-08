"use client";
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ChevronDown, ChevronUp, Scale, Sparkles, AlertCircle } from 'lucide-react';
import { BodyMetricLog } from '@/lib/cadence';
import { toast } from 'sonner';
import {
  FIELD_CONSTRAINTS,
  sanitizeDecimalInput,
  checkBiologicalPlausibility,
} from '@/lib/body-metrics-validation';

interface BodyMetricModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (metric: Partial<BodyMetricLog>) => Promise<boolean>;
  editingMetric?: BodyMetricLog | null;
  unit: 'kg' | 'lb';
  lengthUnit: 'cm' | 'in';
  busy: boolean;
}

/** Keyboard blocker to prevent negatives and non-numeric characters at keystroke level */
const handleDecimalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (
    e.key === 'Backspace' ||
    e.key === 'Delete' ||
    e.key === 'Tab' ||
    e.key === 'Escape' ||
    e.key === 'Enter' ||
    e.key === 'ArrowLeft' ||
    e.key === 'ArrowRight' ||
    e.key === 'ArrowUp' ||
    e.key === 'ArrowDown' ||
    e.key === 'Home' ||
    e.key === 'End' ||
    e.ctrlKey ||
    e.metaKey
  ) {
    return;
  }

  // Allow one decimal separator (period or comma)
  if ((e.key === '.' || e.key === ',') && !e.currentTarget.value.includes('.')) {
    return;
  }

  // Allow digits 0-9 only
  if (/^[0-9]$/.test(e.key)) {
    return;
  }

  // Block negative signs, 'e', '+', letters, special characters
  e.preventDefault();
};

interface MeasurementFieldProps {
  id?: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  fieldKey: string;
  unit: 'cm' | 'in' | 'kg' | 'lb' | '%';
  addon?: string;
  placeholder?: string;
}

function MeasurementField({
  id,
  label,
  value,
  onChange,
  fieldKey,
  unit,
  addon,
  placeholder = '--',
}: MeasurementFieldProps) {
  const constraint = FIELD_CONSTRAINTS[fieldKey] || { maxLength: 5, category: 'large' };
  const warning = checkBiologicalPlausibility(fieldKey, value, unit);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeDecimalInput(e.target.value, constraint.maxLength);
    onChange(sanitized);
  };

  return (
    <div className="metric-field">
      <div className="flex justify-between items-center">
        <label htmlFor={id} className="metric-sublabel">{label}</label>
      </div>
      <div className="metric-field-wrapper">
        <div className={addon ? "metric-input-wrapper-sm" : undefined}>
          <input
            id={id}
            type="text"
            inputMode="decimal"
            maxLength={constraint.maxLength}
            placeholder={placeholder}
            value={value}
            onKeyDown={handleDecimalKeyDown}
            onChange={handleChange}
            className={`metric-text-input ${warning.isOutOfRange ? 'metric-input-warning' : ''}`}
            aria-invalid={warning.isOutOfRange}
          />
          {addon && <span className="metric-input-addon">{addon}</span>}
        </div>
        {warning.isOutOfRange && (
          <div className="metric-warning-tooltip" role="alert">
            <AlertCircle size={11} className="shrink-0" />
            <span>{warning.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BodyMetricModal({
  open,
  onClose,
  onSave,
  editingMetric,
  unit,
  lengthUnit,
  busy,
}: BodyMetricModalProps) {
  const [weight, setWeight] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [note, setNote] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Body Composition
  const [bodyFat, setBodyFat] = useState('');
  const [muscleMass, setMuscleMass] = useState('');

  // Upper Body
  const [neck, setNeck] = useState('');
  const [shoulders, setShoulders] = useState('');
  const [chest, setChest] = useState('');
  const [leftArm, setLeftArm] = useState('');
  const [rightArm, setRightArm] = useState('');
  const [leftForearm, setLeftForearm] = useState('');
  const [rightForearm, setRightForearm] = useState('');

  // Core & Lower Body
  const [waist, setWaist] = useState('');
  const [abdomen, setAbdomen] = useState('');
  const [hips, setHips] = useState('');
  const [leftThigh, setLeftThigh] = useState('');
  const [rightThigh, setRightThigh] = useState('');
  const [leftCalf, setLeftCalf] = useState('');
  const [rightCalf, setRightCalf] = useState('');

  useEffect(() => {
    if (!open) return;
    if (editingMetric) {
      setWeight(editingMetric.weight != null ? String(editingMetric.weight) : '');
      const localIso = editingMetric.timestamp
        ? new Date(editingMetric.timestamp).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16);
      setTimestamp(localIso);
      setNote(editingMetric.note ? editingMetric.note.slice(0, 150) : '');
      setBodyFat(editingMetric.bodyFatPercentage != null ? String(editingMetric.bodyFatPercentage) : '');
      setMuscleMass(editingMetric.muscleMass != null ? String(editingMetric.muscleMass) : '');
      setNeck(editingMetric.neck != null ? String(editingMetric.neck) : '');
      setShoulders(editingMetric.shoulders != null ? String(editingMetric.shoulders) : '');
      setChest(editingMetric.chest != null ? String(editingMetric.chest) : '');
      setLeftArm(editingMetric.leftArm != null ? String(editingMetric.leftArm) : '');
      setRightArm(editingMetric.rightArm != null ? String(editingMetric.rightArm) : '');
      setLeftForearm(editingMetric.leftForearm != null ? String(editingMetric.leftForearm) : '');
      setRightForearm(editingMetric.rightForearm != null ? String(editingMetric.rightForearm) : '');
      setWaist(editingMetric.waist != null ? String(editingMetric.waist) : '');
      setAbdomen(editingMetric.abdomen != null ? String(editingMetric.abdomen) : '');
      setHips(editingMetric.hips != null ? String(editingMetric.hips) : '');
      setLeftThigh(editingMetric.leftThigh != null ? String(editingMetric.leftThigh) : '');
      setRightThigh(editingMetric.rightThigh != null ? String(editingMetric.rightThigh) : '');
      setLeftCalf(editingMetric.leftCalf != null ? String(editingMetric.leftCalf) : '');
      setRightCalf(editingMetric.rightCalf != null ? String(editingMetric.rightCalf) : '');

      const hasAdvancedData = Boolean(
        editingMetric.bodyFatPercentage ||
        editingMetric.muscleMass ||
        editingMetric.neck ||
        editingMetric.shoulders ||
        editingMetric.chest ||
        editingMetric.leftArm ||
        editingMetric.rightArm ||
        editingMetric.waist ||
        editingMetric.hips
      );
      setShowAdvanced(hasAdvancedData);
    } else {
      // Default to current local time
      const now = new Date();
      const offsetMs = now.getTimezoneOffset() * 60000;
      const localTime = new Date(now.getTime() - offsetMs).toISOString().slice(0, 16);
      setTimestamp(localTime);
      setWeight('');
      setNote('');
      setBodyFat('');
      setMuscleMass('');
      setNeck('');
      setShoulders('');
      setChest('');
      setLeftArm('');
      setRightArm('');
      setLeftForearm('');
      setRightForearm('');
      setWaist('');
      setAbdomen('');
      setHips('');
      setLeftThigh('');
      setRightThigh('');
      setLeftCalf('');
      setRightCalf('');
      setShowAdvanced(false);
    }
  }, [open, editingMetric]);

  const parseNum = (val: string) => {
    if (!val.trim()) return undefined;
    const n = parseFloat(val);
    return isNaN(n) ? undefined : n;
  };

  // Check weight biological plausibility
  const weightWarning = checkBiologicalPlausibility('weight', weight, unit);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weight);
    if (isNaN(w) || w <= 0 || w >= 1000) {
      toast.error(`Please enter a valid body weight in ${unit === 'lb' ? 'lbs' : 'kg'}.`);
      return;
    }

    // Check if any entered value is out of biological bounds
    const outOfRangeFields: string[] = [];
    if (weightWarning.isOutOfRange) outOfRangeFields.push('Body Weight');
    if (checkBiologicalPlausibility('bodyFatPercentage', bodyFat, '%').isOutOfRange) outOfRangeFields.push('Body Fat %');
    if (checkBiologicalPlausibility('muscleMass', muscleMass, unit).isOutOfRange) outOfRangeFields.push('Muscle Mass');
    if (checkBiologicalPlausibility('waist', waist, lengthUnit).isOutOfRange) outOfRangeFields.push('Waist');
    if (checkBiologicalPlausibility('neck', neck, lengthUnit).isOutOfRange) outOfRangeFields.push('Neck');
    if (checkBiologicalPlausibility('chest', chest, lengthUnit).isOutOfRange) outOfRangeFields.push('Chest');
    if (checkBiologicalPlausibility('shoulders', shoulders, lengthUnit).isOutOfRange) outOfRangeFields.push('Shoulders');

    if (outOfRangeFields.length > 0) {
      toast.warning(`Note: ${outOfRangeFields.join(', ')} fall outside standard plausible ranges.`);
    }

    const payload: Partial<BodyMetricLog> = {
      id: editingMetric?.id,
      timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
      weight: Math.round(w * 10) / 10,
      note: note.trim() ? note.trim().slice(0, 150) : undefined,
      bodyFatPercentage: parseNum(bodyFat),
      muscleMass: parseNum(muscleMass),
      neck: parseNum(neck),
      shoulders: parseNum(shoulders),
      chest: parseNum(chest),
      leftArm: parseNum(leftArm),
      rightArm: parseNum(rightArm),
      leftForearm: parseNum(leftForearm),
      rightForearm: parseNum(rightForearm),
      waist: parseNum(waist),
      abdomen: parseNum(abdomen),
      hips: parseNum(hips),
      leftThigh: parseNum(leftThigh),
      rightThigh: parseNum(rightThigh),
      leftCalf: parseNum(leftCalf),
      rightCalf: parseNum(rightCalf),
    };

    const ok = await onSave(payload);
    if (ok) {
      onClose();
    }
  };

  const advancedFieldsCount = [
    bodyFat, muscleMass, neck, shoulders, chest, leftArm, rightArm,
    leftForearm, rightForearm, waist, abdomen, hips, leftThigh, rightThigh, leftCalf, rightCalf
  ].filter(v => v.trim() !== '').length;

  return (
    <Dialog open={open} onOpenChange={isOpen => { if (!isOpen && !busy) onClose(); }}>
      <DialogContent className="trainingdialog body-metric-dialog" showCloseButton={!busy}>
        <DialogTitle className="flex items-center gap-2">
          <Scale size={20} className="text-blue-500" />
          {editingMetric ? 'Edit Body Metric' : 'Log Body Weight & Metrics'}
        </DialogTitle>
        <DialogDescription>
          {editingMetric
            ? 'Update your recorded measurements.'
            : 'Record your daily weight. Expand below for body fat % and circumference tape measurements.'}
        </DialogDescription>

        <form onSubmit={handleSubmit} className="body-metric-form">
          {/* Quick Casual Section */}
          <div className="metric-primary-card">
            <label className="metric-label" htmlFor="bm-weight">
              <span>Body Weight</span>
              <span className="metric-unit-badge">{unit === 'lb' ? 'lbs' : 'kg'}</span>
            </label>
            <div className="metric-field-wrapper">
              <div className="metric-input-wrapper">
                <input
                  id="bm-weight"
                  type="text"
                  inputMode="decimal"
                  maxLength={5}
                  autoFocus={!editingMetric}
                  placeholder={unit === 'lb' ? '165.0' : '75.0'}
                  value={weight}
                  onKeyDown={handleDecimalKeyDown}
                  onChange={e => setWeight(sanitizeDecimalInput(e.target.value, 5))}
                  required
                  className={`metric-weight-input ${weightWarning.isOutOfRange ? 'metric-input-warning' : ''}`}
                />
                <span className="metric-unit-suffix">{unit === 'lb' ? 'lbs' : 'kg'}</span>
              </div>
              {weightWarning.isOutOfRange && (
                <div className="metric-warning-tooltip" role="alert">
                  <AlertCircle size={12} className="shrink-0" />
                  <span>{weightWarning.message}</span>
                </div>
              )}
            </div>

            <div className="metric-row-split">
              <div className="metric-field">
                <label htmlFor="bm-timestamp" className="metric-sublabel">Date & Time</label>
                <input
                  id="bm-timestamp"
                  type="datetime-local"
                  value={timestamp}
                  onChange={e => setTimestamp(e.target.value)}
                  className="metric-text-input"
                />
              </div>
            </div>

            <div className="metric-field">
              <div className="flex justify-between items-center">
                <label htmlFor="bm-note" className="metric-sublabel">Note (optional)</label>
                <span className="text-xs text-slate-400">{note.length}/150</span>
              </div>
              <input
                id="bm-note"
                type="text"
                maxLength={150}
                placeholder="e.g., Morning fasted weigh-in"
                value={note}
                onChange={e => setNote(e.target.value.slice(0, 150))}
                className="metric-text-input"
              />
            </div>
          </div>

          {/* Advanced / Circumference Toggle */}
          <div className="metric-advanced-accordion">
            <button
              type="button"
              className="metric-advanced-toggle"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                <span className="font-semibold text-sm">Circumferences & Body Composition</span>
                {advancedFieldsCount > 0 && (
                  <span className="metric-badge-count">{advancedFieldsCount} filled</span>
                )}
              </div>
              {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {showAdvanced && (
              <div className="metric-advanced-content">
                {/* Body Composition */}
                <div className="metric-group">
                  <h4 className="metric-group-title">Body Composition</h4>
                  <div className="metric-grid-2">
                    <MeasurementField
                      id="bm-bodyfat"
                      label="Body Fat %"
                      value={bodyFat}
                      onChange={setBodyFat}
                      fieldKey="bodyFatPercentage"
                      unit="%"
                      addon="%"
                      placeholder="e.g. 15.5"
                    />
                    <MeasurementField
                      id="bm-musclemass"
                      label="Muscle Mass"
                      value={muscleMass}
                      onChange={setMuscleMass}
                      fieldKey="muscleMass"
                      unit={unit}
                      addon={unit === 'lb' ? 'lbs' : 'kg'}
                      placeholder={unit === 'lb' ? '125.0' : '57.0'}
                    />
                  </div>
                </div>

                {/* Upper Body */}
                <div className="metric-group">
                  <h4 className="metric-group-title">
                    Upper Body <span className="text-xs font-normal text-slate-400">({lengthUnit})</span>
                  </h4>
                  <div className="metric-grid-3">
                    <MeasurementField
                      id="bm-neck"
                      label="Neck"
                      value={neck}
                      onChange={setNeck}
                      fieldKey="neck"
                      unit={lengthUnit}
                    />
                    <MeasurementField
                      id="bm-shoulders"
                      label="Shoulders"
                      value={shoulders}
                      onChange={setShoulders}
                      fieldKey="shoulders"
                      unit={lengthUnit}
                    />
                    <MeasurementField
                      id="bm-chest"
                      label="Chest"
                      value={chest}
                      onChange={setChest}
                      fieldKey="chest"
                      unit={lengthUnit}
                    />
                  </div>

                  <div className="metric-grid-2 mt-2">
                    <MeasurementField
                      id="bm-leftarm"
                      label="Left Arm"
                      value={leftArm}
                      onChange={setLeftArm}
                      fieldKey="leftArm"
                      unit={lengthUnit}
                    />
                    <MeasurementField
                      id="bm-rightarm"
                      label="Right Arm"
                      value={rightArm}
                      onChange={setRightArm}
                      fieldKey="rightArm"
                      unit={lengthUnit}
                    />
                  </div>

                  <div className="metric-grid-2 mt-2">
                    <MeasurementField
                      id="bm-leftforearm"
                      label="Left Forearm"
                      value={leftForearm}
                      onChange={setLeftForearm}
                      fieldKey="leftForearm"
                      unit={lengthUnit}
                    />
                    <MeasurementField
                      id="bm-rightforearm"
                      label="Right Forearm"
                      value={rightForearm}
                      onChange={setRightForearm}
                      fieldKey="rightForearm"
                      unit={lengthUnit}
                    />
                  </div>
                </div>

                {/* Core & Lower Body */}
                <div className="metric-group">
                  <h4 className="metric-group-title">
                    Core & Lower Body <span className="text-xs font-normal text-slate-400">({lengthUnit})</span>
                  </h4>
                  <div className="metric-grid-3">
                    <MeasurementField
                      id="bm-waist"
                      label="Waist"
                      value={waist}
                      onChange={setWaist}
                      fieldKey="waist"
                      unit={lengthUnit}
                    />
                    <MeasurementField
                      id="bm-abdomen"
                      label="Abdomen"
                      value={abdomen}
                      onChange={setAbdomen}
                      fieldKey="abdomen"
                      unit={lengthUnit}
                    />
                    <MeasurementField
                      id="bm-hips"
                      label="Hips"
                      value={hips}
                      onChange={setHips}
                      fieldKey="hips"
                      unit={lengthUnit}
                    />
                  </div>

                  <div className="metric-grid-2 mt-2">
                    <MeasurementField
                      id="bm-leftthigh"
                      label="Left Thigh"
                      value={leftThigh}
                      onChange={setLeftThigh}
                      fieldKey="leftThigh"
                      unit={lengthUnit}
                    />
                    <MeasurementField
                      id="bm-rightthigh"
                      label="Right Thigh"
                      value={rightThigh}
                      onChange={setRightThigh}
                      fieldKey="rightThigh"
                      unit={lengthUnit}
                    />
                  </div>

                  <div className="metric-grid-2 mt-2">
                    <MeasurementField
                      id="bm-leftcalf"
                      label="Left Calf"
                      value={leftCalf}
                      onChange={setLeftCalf}
                      fieldKey="leftCalf"
                      unit={lengthUnit}
                    />
                    <MeasurementField
                      id="bm-rightcalf"
                      label="Right Calf"
                      value={rightCalf}
                      onChange={setRightCalf}
                      fieldKey="rightCalf"
                      unit={lengthUnit}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="metric-form-actions">
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary"
              disabled={busy || !weight}
            >
              {editingMetric ? 'Save Changes' : 'Log Entry'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
