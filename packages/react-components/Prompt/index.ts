import { type ReactNode } from 'react';
import { type Blocker, useBlocker } from 'react-router-dom';

function usePrompt(message: string, blocker: Blocker): void {
  if (blocker.state === 'blocked') {
    // eslint-disable-next-line no-alert
    const confirm = window.confirm(message);
    if (confirm) {
      blocker.proceed();
    }
    blocker.reset();
  }
}

interface PromptProps {
  readonly message: string;
  readonly when?: boolean;
}

export function Prompt({ message, when = true }: PromptProps): ReactNode {
  const blocker = useBlocker(when);
  usePrompt(message, blocker);
  return null;
}
