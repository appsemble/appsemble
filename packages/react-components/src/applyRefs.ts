import type { MutableRefObject, RefCallback } from 'react';

type MutableRef<T> = RefCallback<T> | MutableRefObject<T>;

/**
 * Apply the given value to some react refs.
 *
 * @param value - The value to set on the refs.
 * @param refs - Any number of ref callbacks or ref objects.
 */
export function applyRefs<T>(value: T, ...refs: MutableRef<T>[]): void {
  refs.forEach((ref) => {
    if (ref instanceof Function) {
      ref(value);
    } else if (ref) {
      // eslint-disable-next-line no-param-reassign
      ref.current = value;
    }
  });
}
