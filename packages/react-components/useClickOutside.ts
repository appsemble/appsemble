import { type RefObject, useCallback } from 'react';

import { useEventListener } from './index.js';

/**
 * Run a function when the user clicks outside of an element.
 *
 * @param ref A ref for the HTML element.
 * @param handler The function to run.
 * @param exceptionRef A ref which is exempt from triggering the handler.
 */
export function useClickOutside(
  ref: RefObject<Element>,
  handler: (event: Event) => void,
  exceptionRef?: RefObject<Element>,
): void {
  const listener = useCallback(
    (event: Event): void => {
      if (!ref.current) {
        return;
      }

      const composedPath = event.composedPath();

      // Do nothing if clicking ref's element or descendent elements
      if (composedPath.indexOf(ref.current) > 0) {
        return;
      }
      if (exceptionRef && exceptionRef.current && composedPath.includes(exceptionRef.current)) {
        return;
      }

      handler(event);
    },
    [exceptionRef, handler, ref],
  );

  useEventListener(document, 'mousedown', listener);
  useEventListener(document, 'touchstart', listener);
}
