import { type RefCallback } from 'preact';
import { type MutableRefObject } from 'preact/compat';

type MutableRef<T> = MutableRefObject<T> | RefCallback<T>;

/**
 * Apply the given value to some react refs.
 *
 * @param value The value to set on the refs.
 * @param refs Any number of ref callbacks or ref objects.
 */
export function applyRefs<T>(value: T, ...refs: MutableRef<T>[]): void {
  for (const ref of refs) {
    if (ref instanceof Function) {
      ref(value);
    } else if (ref) {
      ref.current = value;
    }
  }
}
