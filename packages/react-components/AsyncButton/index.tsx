import {
  type ComponentPropsWithoutRef,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useState,
} from 'react';

import { Button } from '../index.js';

interface AsyncButtonProps extends ComponentPropsWithoutRef<typeof Button> {
  /**
   * The asynchronous action to perform when the button is clicked.
   */
  readonly onClick: (event: MouseEvent<HTMLButtonElement>) => Promise<void>;
}

/**
 * A button which when clicked, goes into a loading state, performs an asynchronous action, and goes
 * out of the loading state when the action has finished.
 */
export function AsyncButton({ disabled, onClick, ...props }: AsyncButtonProps): ReactNode {
  const [isBusy, setIsBusy] = useState(false);

  const handleClick = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
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
