import { Button } from '@appsemble/react-components';
import * as React from 'react';

interface AsyncButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
  /**
   * The asynchtonous action to perform when the button is clicked.
   */
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => Promise<void>;
}

/**
 * A button which when clicked, goes into a loading state, performs an asynchronous action, and goes
 * out of the loading state when the action has finished.
 */
export default function AsyncButton({
  disabled,
  onClick,
  ...props
}: AsyncButtonProps): React.ReactElement {
  const [isBusy, setBusy] = React.useState(false);

  const handleClick = React.useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      setBusy(true);
      try {
        await onClick(event);
      } finally {
        setBusy(false);
      }
    },
    [onClick],
  );

  return <Button {...props} disabled={disabled || isBusy} loading={isBusy} onClick={handleClick} />;
}
