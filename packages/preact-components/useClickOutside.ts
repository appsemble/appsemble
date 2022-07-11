import { RefObject } from 'preact';
import { useCallback } from 'preact/hooks';

import { useEventListener } from '.';

/**
 * Run a function when the user clicks outside of an element.
 *
 * @param ref A ref for the HTML element.
 * @param handler The function to run.
 */
export function useClickOutside(ref: RefObject<Element>, handler: (event: Event) => void): void {
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

      handler(event);
    },
    [handler, ref],
  );

  useEventListener(document, 'mousedown', listener);
  useEventListener(document, 'touchstart', listener);
}
