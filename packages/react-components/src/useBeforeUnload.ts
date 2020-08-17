import { useCallback } from 'react';

import { useEventListener } from '.';

/**
 * Prompt for the user to be sure if they want to leave the page.
 *
 * @param shouldPrompt - Whether the user should be prompted.
 */
export function useBeforeUnload(shouldPrompt: boolean): void {
  const check = useCallback(
    (event: BeforeUnloadEvent) => {
      if (shouldPrompt) {
        event.preventDefault();
        // eslint-disable-next-line no-param-reassign
        event.returnValue = '';
        return;
      }

      // eslint-disable-next-line no-param-reassign
      delete event.returnValue;
    },
    [shouldPrompt],
  );

  useEventListener(window, 'beforeunload', check);
}
