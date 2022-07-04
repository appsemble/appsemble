import { MutableRefObject, RefCallback, useCallback } from 'react';

import { applyRefs } from '.';

type MutableRef<T> = MutableRefObject<T> | RefCallback<T>;

/**
 * Combine multiple refs into one functional ref.
 *
 * @param refs - The refs to combine.
 * @returns A function that will apply the value on all given refs.
 */
export function useCombinedRefs<T>(...refs: MutableRef<T>[]): RefCallback<T> {
  // The refs explicitly are the dependency array. They shouldn’t be in it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback((value) => applyRefs(value, ...refs), refs);
}
