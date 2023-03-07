import { ReactElement, useCallback, useContext, useEffect } from 'react';
import { UNSAFE_NavigationContext as NavigationContext } from 'react-router-dom';

/**
 * Source: https://github.com/remix-run/react-router/issues/8139#issuecomment-1291561405
 */

function useConfirmExit(confirmExit: () => boolean, when = true): void {
  const { navigator } = useContext(NavigationContext);

  useEffect(() => {
    if (!when) {
      return;
    }

    const { push } = navigator;

    navigator.push = (...args: Parameters<typeof push>) => {
      const result = confirmExit();
      if (result !== false) {
        push(...args);
      }
    };

    return () => {
      navigator.push = push;
    };
  }, [navigator, confirmExit, when]);
}

export function usePrompt(message: string, when = true): void {
  useEffect(() => {
    if (when) {
      window.onbeforeunload = () => message;
    }

    return () => {
      window.onbeforeunload = null;
    };
  }, [message, when]);

  const confirmExit = useCallback(() => {
    // eslint-disable-next-line no-alert
    const confirm = window.confirm(message);
    return confirm;
  }, [message]);
  useConfirmExit(confirmExit, when);
}

interface PromptProps {
  message: string;
  when?: boolean;
}

export function Prompt({ message, when }: PromptProps): ReactElement {
  usePrompt(message, when);
  return null;
}
