import { Utils } from '@appsemble/sdk';

import { Field } from '../../block';

type FieldWithRequirements = Field & { requirements?: any[] };

/**
 * Check if a field is required.
 *
 * @param field - The field to check.
 * @returns Whether or not the field is required.
 */
export function isRequired(field: FieldWithRequirements): boolean {
  return Boolean(field.requirements?.some(({ required }) => required));
}

/**
 * Check if a given date is a valid.
 *
 * @param date - The date to check
 * @returns Whether the date is a valid date object.
 */
export function isValidDate(date: Date): boolean {
  return date instanceof Date && !Number.isNaN(date);
}

/**
 * Get the earliest date of a field.
 *
 * @param field - The field to check.
 * @param utils - The Appsemble SDK utils.
 * @returns A date object matching the earliest date.
 */
export function getMinDate(field: FieldWithRequirements, utils: Utils): Date | undefined {
  const minDates = field.requirements
    ?.filter((r) => 'from' in r)
    .map((r) => new Date(utils.remap(r.from, null) as any))
    .filter(isValidDate);
  if (minDates?.length) {
    return minDates.sort()[0];
  }
}

/**
 * Get the last date of a field.
 *
 * @param field - The field to check.
 * @param utils - The Appsemble SDK utils.
 * @returns A date object matching the last date.
 */
export function getMaxDate(field: FieldWithRequirements, utils: Utils): Date | undefined {
  const maxDates = field.requirements
    ?.filter((r) => 'to' in r)
    .map((r) => new Date(utils.remap(r.to, null) as any))
    .filter(isValidDate);
  if (maxDates?.length) {
    return maxDates.sort()[maxDates.length - 1];
  }
}

/**
 * Get the absolute minimum length of a field.
 *
 * @param field - The field to check.
 * @returns The minimum length of the field.
 */
export function getMinLength(field: FieldWithRequirements): number | undefined {
  const minLengths = field.requirements?.map((r) => r.minLength).filter(Number.isFinite);
  if (minLengths?.length) {
    return Math.max(...minLengths);
  }
}

/**
 * Get the absolute maximum length of a field.
 *
 * @param field - The field to check.
 * @returns The maximum length of the field.
 */
export function getMaxLength(field: FieldWithRequirements): number | undefined {
  const maxLengths = field.requirements?.map((r) => r.maxLength).filter(Number.isFinite);
  if (maxLengths?.length) {
    return Math.min(...maxLengths);
  }
}

/**
 * Get the absolute minumum value of a field.
 *
 * @param field - The field to check.
 * @returns The minumum value of the field.
 */
export function getMin(field: FieldWithRequirements): number | undefined {
  const minimums = field.requirements?.map((r) => r.min).filter(Number.isFinite);
  if (minimums?.length) {
    return Math.max(...minimums);
  }
}

/**
 * Get the absolute maximum value of a field.
 *
 * @param field - The field to check.
 * @returns The maximum value of the field.
 */
export function getMax(field: FieldWithRequirements): number | undefined {
  const maximums = field.requirements?.map((r) => r.min).filter(Number.isFinite);
  if (maximums?.length) {
    return Math.min(...maximums);
  }
}

/**
 * Get the minimum step of a field.
 *
 * @param field - The field to check.
 * @returns The minumum step.
 */
export function getStep(field: FieldWithRequirements): number | undefined {
  const steps = field.requirements?.map((r) => r.step).filter(Number.isFinite);
  if (steps?.length) {
    return Math.min(...steps);
  }
}

/**
 * Get the joined accept value for the field.
 *
 * @param field - The field to check.
 * @returns The accept attribute
 */
export function getAccept(field: FieldWithRequirements): string {
  return field.requirements?.map((r) => r.accept).join(',');
}
