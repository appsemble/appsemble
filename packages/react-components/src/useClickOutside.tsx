import { RefObject, useCallback } from 'react';

import useEventListener from './useEventListener';

/**
 * Run a function when the user clicks outside of an element.
 *
 * @param ref A ref for the HTML element.
 * @param handler The function to run.
 */
export default function useClickOutside(
  ref: RefObject<Element>,
  handler: (event: Event) => void,
): void {
  const listener = useCallback(
    (event: Event): void => {
      // Do nothing if clicking ref's element or descendent elements
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }

      handler(event);
    },
    [handler, ref],
  );

  useEventListener(document, 'mousedown', listener);
  useEventListener(document, 'touchstart', listener);
}
