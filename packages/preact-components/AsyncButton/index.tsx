import { type ComponentProps, type JSX, type VNode } from 'preact';
import { useCallback, useState } from 'preact/hooks';

import { Button } from '../index.js';

interface AsyncButtonProps extends Omit<ComponentProps<typeof Button>, 'onClick'> {
  /**
   * The asynchronous action to perform when the button is clicked.
   */
  readonly onClick: (event: JSX.TargetedMouseEvent<HTMLButtonElement>) => Promise<void>;
}

/**
 * A button which when clicked, goes into a loading state, performs an asynchronous action, and goes
 * out of the loading state when the action has finished.
 */
export function AsyncButton({ disabled, onClick, ...props }: AsyncButtonProps): VNode {
  const [isBusy, setIsBusy] = useState(false);

  const handleClick = useCallback(
    async (event: JSX.TargetedMouseEvent<HTMLButtonElement>) => {
      setIsBusy(true);
      try {
        await onClick(event);
      } finally {
        setIsBusy(false);
      }
    },
    [onClick],
  );

  return <Button {...props} disabled={disabled || isBusy} loading={isBusy} onClick={handleClick} />;
}
