import { useEffect, useState } from 'preact/hooks';

/**
 * Use a debounced value.
 *
 * @param value The value to debounce.
 * @param delay The debounce interval in milliseconds.
 * @returns debounced result.
 */
export function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
