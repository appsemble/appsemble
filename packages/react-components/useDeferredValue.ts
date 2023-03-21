import { useEffect, useState } from 'react';

/**
 * Replace with with https://react.dev/reference/react/useDeferredValue when migrating to React 18.
 *
 * @param value The value to defer. This must be a primitive.
 * @returns A deferred value
 */
export function useDeferredValue<T>(value: T): T {
  const [deferredValue, setDeferredValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDeferredValue(value);
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [value]);

  return deferredValue;
}
