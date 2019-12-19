import { HTMLEvent } from '@appsemble/dom-types';
import { RefObject, useEffect } from 'react';

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
  useEffect(() => {
    const listener = (event: HTMLEvent<Element>): void => {
      // Do nothing if clicking ref's element or descendent elements
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }

      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [handler, ref]);
}
