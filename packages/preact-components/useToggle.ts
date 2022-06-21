import { useCallback, useMemo, useState } from 'preact/hooks';

/**
 * An object for keeping track of a boolean state.
 */
export interface Toggle {
  /**
   * Set the enabled state to `false`.
   */
  disable: () => void;

  /**
   * Set the enabled state to `true`.
   */
  enable: () => void;

  /**
   * Whether ot not the toggle is enabled..
   */
  enabled: boolean;

  /**
   * Set the enabled state to `true` if it is `false`, or to `false` otherwise.
   */
  toggle: () => void;
}

/**
 * A hook for keeping track of a boolean state.
 *
 * @param initialState - The initial value.
 * @returns The toggle state.
 */
export function useToggle(initialState = false): Toggle {
  const [enabled, setEnabled] = useState(initialState);

  const disable = useCallback(() => {
    setEnabled(false);
  }, []);

  const enable = useCallback(() => {
    setEnabled(true);
  }, []);

  const toggle = useCallback(() => {
    setEnabled(!enabled);
  }, [enabled]);

  return useMemo(
    () => ({
      disable,
      enable,
      enabled,
      toggle,
    }),
    [disable, enable, enabled, toggle],
  );
}
