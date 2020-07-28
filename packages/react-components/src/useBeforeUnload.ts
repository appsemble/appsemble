import { useCallback } from 'react';

import useEventListener from './useEventListener';

/**
 * Prompt for the user to be sure if they want to leave the page.
 *
 * @param shouldPrompt Whether the user should be prompted.
 */
export default function useBeforeUnload(shouldPrompt: boolean): void {
  const check = useCallback(
    (e: BeforeUnloadEvent) => {
      if (shouldPrompt) {
        e.preventDefault();
        e.returnValue = '';
        return;
      }

      delete e.returnValue;
    },
    [shouldPrompt],
  );

  useEventListener(window, 'beforeunload', check);
}
