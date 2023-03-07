import { isValidElement, VNode } from 'preact';

/**
 * Check whether a value is a valid Preact child.
 *
 * A value is considered a valid child if it is a non-empty string, a finite number, or a Preact
 * VNode.
 *
 * @param value The value to check
 * @returns Whether or not a value is a valid preact child.
 */
export function isPreactChild(value: unknown): value is VNode | number | string {
  return (
    value != null &&
    value !== '' &&
    (typeof value === 'string' ||
      (typeof value === 'number' && Number.isFinite(value)) ||
      isValidElement(value))
  );
}
