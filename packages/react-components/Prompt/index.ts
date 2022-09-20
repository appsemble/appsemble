import { Blocker, History, Transition } from 'history';
import { ContextType, ReactElement, useCallback, useContext, useEffect } from 'react';
import {
  Navigator as BaseNavigator,
  UNSAFE_NavigationContext as NavigationContext,
} from 'react-router-dom';

/**
 * Source: https://github.com/remix-run/react-router/commit/256cad70d3fd4500b1abcfea66f3ee622fb90874
 */

interface Navigator extends BaseNavigator {
  block: History['block'];
}

type NavigationContextWithBlock = ContextType<typeof NavigationContext> & { navigator: Navigator };

function useBlocker(blocker: Blocker, when = true): void {
  const { navigator } = useContext(NavigationContext) as NavigationContextWithBlock;
  useEffect(() => {
    if (!when) {
      return;
    }

    const unblock = navigator.block((tx) => {
      const autoUnblockingTx = {
        ...tx,
        retry() {
          unblock();
          tx.retry();
        },
      };
      blocker(autoUnblockingTx);
    });
    return unblock;
  }, [navigator, blocker, when]);
}

function usePrompt(
  message: string | ((location: Transition['location'], action: Transition['action']) => string),
  when = true,
): void {
  const blocker = useCallback(
    (tx: Transition) => {
      let response;
      if (typeof message === 'function') {
        response = message(tx.location, tx.action);
        if (typeof response === 'string') {
          // eslint-disable-next-line no-alert
          response = window.confirm(response);
        }
      } else {
        // eslint-disable-next-line no-alert
        response = window.confirm(message);
      }
      if (response) {
        tx.retry();
      }
    },
    [message],
  );
  return useBlocker(blocker, when);
}

interface PromptProps {
  message: string;
  when?: boolean;
}

export function Prompt({ message, when }: PromptProps): ReactElement {
  usePrompt(message, when);
  return null;
}
