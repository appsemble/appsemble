import { useCallback, useState } from 'react';

/**
 * A hook to get a force update function.
 *
 * @returns A function to force update a functional React component.
 */
export function useForceUpdate(): () => void {
  const [, updateState] = useState<{ [key: string]: never }>();
  return useCallback(() => updateState({}), []);
}
