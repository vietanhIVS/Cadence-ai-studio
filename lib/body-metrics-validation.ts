/**
 * Validation rules and input constraints for Body Metrics
 * Conforming to Section 3.1 Field Validation & Input Constraints:
 * - Numeric only (inputMode="decimal"): digits 0-9 and at most one decimal point. Block negative & non-numeric.
 * - Precision: Maximum 1 decimal place (e.g. 15.5, not 15.55).
 * - Character Length Limits (maxLength):
 *   - Small circumference fields & Body Fat %: Max 4 chars (e.g. 99.9)
 *   - Large circumference fields & Muscle Mass: Max 5 chars (e.g. 199.5)
 *   - Note: Max 150 chars
 * - Out-of-range Handling: Biologically plausible boundaries check.
 */

export type CircumferenceFieldCategory = 'small' | 'large';

export interface FieldConstraint {
  category: CircumferenceFieldCategory;
  maxLength: number;
  minPlausible: (unit: 'cm' | 'in' | 'kg' | 'lb' | '%') => number;
  maxPlausible: (unit: 'cm' | 'in' | 'kg' | 'lb' | '%') => number;
  unitLabel: (lengthUnit: 'cm' | 'in', massUnit: 'kg' | 'lb') => string;
}

export const FIELD_CONSTRAINTS: Record<string, FieldConstraint> = {
  // Body Composition
  bodyFatPercentage: {
    category: 'small',
    maxLength: 4,
    minPlausible: () => 2.0,
    maxPlausible: () => 70.0, // Biologically plausible boundary (prompt example: > 70%)
    unitLabel: () => '%',
  },
  muscleMass: {
    category: 'large',
    maxLength: 5,
    minPlausible: (u) => (u === 'lb' ? 22.0 : 10.0),
    maxPlausible: (u) => (u === 'lb' ? 310.0 : 140.0),
    unitLabel: (_, massUnit) => massUnit === 'lb' ? 'lbs' : 'kg',
  },

  // Small Circumferences (Max 4 chars)
  neck: {
    category: 'small',
    maxLength: 4,
    minPlausible: (u) => (u === 'in' ? 8.0 : 20.0),
    maxPlausible: (u) => (u === 'in' ? 26.0 : 65.0),
    unitLabel: (lengthUnit) => lengthUnit,
  },
  leftArm: {
    category: 'small',
    maxLength: 4,
    minPlausible: (u) => (u === 'in' ? 6.0 : 15.0),
    maxPlausible: (u) => (u === 'in' ? 26.0 : 65.0),
    unitLabel: (lengthUnit) => lengthUnit,
  },
  rightArm: {
    category: 'small',
    maxLength: 4,
    minPlausible: (u) => (u === 'in' ? 6.0 : 15.0),
    maxPlausible: (u) => (u === 'in' ? 26.0 : 65.0),
    unitLabel: (lengthUnit) => lengthUnit,
  },
  leftForearm: {
    category: 'small',
    maxLength: 4,
    minPlausible: (u) => (u === 'in' ? 4.5 : 12.0),
    maxPlausible: (u) => (u === 'in' ? 20.0 : 50.0),
    unitLabel: (lengthUnit) => lengthUnit,
  },
  rightForearm: {
    category: 'small',
    maxLength: 4,
    minPlausible: (u) => (u === 'in' ? 4.5 : 12.0),
    maxPlausible: (u) => (u === 'in' ? 20.0 : 50.0),
    unitLabel: (lengthUnit) => lengthUnit,
  },
  leftThigh: {
    category: 'small',
    maxLength: 4,
    minPlausible: (u) => (u === 'in' ? 10.0 : 25.0),
    maxPlausible: (u) => (u === 'in' ? 40.0 : 100.0),
    unitLabel: (lengthUnit) => lengthUnit,
  },
  rightThigh: {
    category: 'small',
    maxLength: 4,
    minPlausible: (u) => (u === 'in' ? 10.0 : 25.0),
    maxPlausible: (u) => (u === 'in' ? 40.0 : 100.0),
    unitLabel: (lengthUnit) => lengthUnit,
  },
  leftCalf: {
    category: 'small',
    maxLength: 4,
    minPlausible: (u) => (u === 'in' ? 7.0 : 18.0),
    maxPlausible: (u) => (u === 'in' ? 28.0 : 70.0),
    unitLabel: (lengthUnit) => lengthUnit,
  },
  rightCalf: {
    category: 'small',
    maxLength: 4,
    minPlausible: (u) => (u === 'in' ? 7.0 : 18.0),
    maxPlausible: (u) => (u === 'in' ? 28.0 : 70.0),
    unitLabel: (lengthUnit) => lengthUnit,
  },

  // Large Circumferences (Max 5 chars)
  shoulders: {
    category: 'large',
    maxLength: 5,
    minPlausible: (u) => (u === 'in' ? 22.0 : 55.0),
    maxPlausible: (u) => (u === 'in' ? 75.0 : 190.0),
    unitLabel: (lengthUnit) => lengthUnit,
  },
  chest: {
    category: 'large',
    maxLength: 5,
    minPlausible: (u) => (u === 'in' ? 18.0 : 45.0),
    maxPlausible: (u) => (u === 'in' ? 75.0 : 190.0),
    unitLabel: (lengthUnit) => lengthUnit,
  },
  waist: {
    category: 'large',
    maxLength: 5,
    minPlausible: (u) => (u === 'in' ? 14.0 : 35.0),
    maxPlausible: (u) => (u === 'in' ? 87.0 : 220.0), // Biologically plausible boundary (prompt example: > 220 cm)
    unitLabel: (lengthUnit) => lengthUnit,
  },
  abdomen: {
    category: 'large',
    maxLength: 5,
    minPlausible: (u) => (u === 'in' ? 14.0 : 35.0),
    maxPlausible: (u) => (u === 'in' ? 87.0 : 220.0),
    unitLabel: (lengthUnit) => lengthUnit,
  },
  hips: {
    category: 'large',
    maxLength: 5,
    minPlausible: (u) => (u === 'in' ? 18.0 : 45.0),
    maxPlausible: (u) => (u === 'in' ? 87.0 : 220.0),
    unitLabel: (lengthUnit) => lengthUnit,
  },

  // Core Weight (Max 5 chars: e.g. 999.9 or 199.5)
  weight: {
    category: 'large',
    maxLength: 5,
    minPlausible: (u) => (u === 'lb' ? 45.0 : 20.0),
    maxPlausible: (u) => (u === 'lb' ? 900.0 : 400.0),
    unitLabel: (_, massUnit) => massUnit === 'lb' ? 'lbs' : 'kg',
  },
};

/**
 * Sanitizes input text to strictly allow digits 0-9 and at most one decimal point.
 * Enforces maximum of 1 decimal place and character maxLength constraint.
 */
export function sanitizeDecimalInput(rawValue: string, maxLength: number): string {
  if (!rawValue) return '';

  // Replace comma with dot for mobile keyboards
  let val = rawValue.replace(/,/g, '.');

  // Strip anything that is NOT a digit or a decimal dot (blocks negatives, letters, symbols)
  val = val.replace(/[^0-9.]/g, '');

  // Keep only the first decimal point
  const firstDot = val.indexOf('.');
  if (firstDot !== -1) {
    const integerPart = val.slice(0, firstDot);
    const decimalPart = val.slice(firstDot + 1).replace(/\./g, '');
    // Maximum 1 decimal place precision
    val = integerPart + '.' + decimalPart.slice(0, 1);
  }

  // Enforce maxLength constraint
  if (val.length > maxLength) {
    val = val.slice(0, maxLength);
  }

  return val;
}

/**
 * Validates whether an entered value falls outside biologically plausible boundaries.
 * Returns { isOutOfRange: boolean, message?: string }
 */
export function checkBiologicalPlausibility(
  fieldName: string,
  valueStr: string,
  unit: 'cm' | 'in' | 'kg' | 'lb' | '%'
): { isOutOfRange: boolean; message?: string; min?: number; max?: number } {
  const trimmed = valueStr.trim();
  if (!trimmed) {
    return { isOutOfRange: false };
  }

  const num = parseFloat(trimmed);
  if (isNaN(num)) {
    return { isOutOfRange: false };
  }

  const constraint = FIELD_CONSTRAINTS[fieldName];
  if (!constraint) {
    return { isOutOfRange: false };
  }

  const min = constraint.minPlausible(unit);
  const max = constraint.maxPlausible(unit);

  if (num < min) {
    return {
      isOutOfRange: true,
      min,
      max,
      message: `Unusually low (< ${min} ${unit})`,
    };
  }

  if (num > max) {
    return {
      isOutOfRange: true,
      min,
      max,
      message: `Unusually high (> ${max} ${unit})`,
    };
  }

  return { isOutOfRange: false, min, max };
}
