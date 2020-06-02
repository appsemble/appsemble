import type { BulmaColor } from '@appsemble/sdk';
import * as React from 'react';

import { CardFooterButton, Modal } from '..';

interface ConfirmationOptions<T, A extends any[]> {
  /**
   * The title to render on the confirmation prompt.
   */
  title: React.ReactNode;

  /**
   * The body to render on the confirmation prompt.
   */
  body: React.ReactNode;

  /**
   * The label to render on the cancellation button.
   */
  cancelLabel: React.ReactNode;

  /**
   * The label to render on the confirmation button.
   */
  confirmLabel: React.ReactNode;

  /**
   * The color to use for the confirmation button.
   */
  color?: BulmaColor;

  /**
   * The action to perform if the user confirms the action.
   */
  action: (...args: A) => T;
}

interface ConfirmationProps {
  children: React.ReactNode;
}

interface DeferredConfirmationOptions extends ConfirmationOptions<any, any[]> {
  resolve: () => void;
  reject: () => void;
}

const Context = React.createContext(null);

/**
 * A provider for the {@link useConfirmation} hook.
 */
export default function Confirmation({ children }: ConfirmationProps): React.ReactElement {
  const [options, setOptions] = React.useState<DeferredConfirmationOptions>(null);
  const [isActive, setActive] = React.useState(false);

  const confirm = React.useCallback(async (opts: ConfirmationOptions<any, any[]>, args) => {
    try {
      await new Promise((resolve, reject) => {
        setOptions({ ...opts, resolve, reject });
        setActive(true);
      });
    } finally {
      // The timeout must match the transition length of Modal.
      setTimeout(() => setActive(false), 90);
    }
    return opts.action(...args);
  }, []);

  return (
    <Context.Provider value={confirm}>
      <Modal
        footer={
          <>
            <CardFooterButton onClick={options?.reject}>{options?.cancelLabel}</CardFooterButton>
            <CardFooterButton color={options?.color ?? 'danger'} onClick={options?.resolve}>
              {options?.confirmLabel}
            </CardFooterButton>
          </>
        }
        isActive={isActive}
        onClose={options?.reject}
        title={options?.title}
      >
        {options?.body}
      </Modal>
      {children}
    </Context.Provider>
  );
}

/**
 *
 *
 * @param options The configuration options for the modal.
 */
export function useConfirmation<T, A extends any[]>(
  options: ConfirmationOptions<T, A>,
): (...args: A) => Promise<T> {
  const confirm = React.useContext(Context);

  return React.useCallback((...args: A) => confirm(options, args), [confirm, options]);
}
