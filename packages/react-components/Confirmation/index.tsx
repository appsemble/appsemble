import { type BulmaColor } from '@appsemble/types';
import { createContext, type ReactNode, useCallback, useContext, useState } from 'react';

import styles from './index.module.css';
import { CardFooterButton, ModalCard } from '../index.js';

interface ConfirmationOptions<T, A extends any[]> {
  /**
   * The title to render on the confirmation prompt.
   */
  title: ReactNode;

  /**
   * The body to render on the confirmation prompt.
   */
  body: ReactNode;

  /**
   * The label to render on the cancellation button.
   */
  cancelLabel: ReactNode;

  /**
   * The label to render on the confirmation button.
   */
  confirmLabel: ReactNode;

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
  readonly children: ReactNode;
}

interface DeferredConfirmationOptions extends ConfirmationOptions<any, any[]> {
  resolve: () => void;
  reject: () => void;
}

const Context = createContext<(...args: any[]) => Promise<any>>(() => Promise.resolve());

/**
 * A provider for the {@link useConfirmation} hook.
 */
export function Confirmation({ children }: ConfirmationProps): ReactNode {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  const [options, setOptions] = useState<DeferredConfirmationOptions>(null);
  const [isActive, setIsActive] = useState(false);

  const confirm = useCallback(async (opts: ConfirmationOptions<any, any[]>, args: unknown[]) => {
    try {
      await new Promise<void>((resolve, reject) => {
        setOptions({ ...opts, resolve, reject });
        setIsActive(true);
      });
    } finally {
      // The timeout must match the transition length of Modal.
      setTimeout(() => setIsActive(false), 90);
    }
    return opts.action(...args);
  }, []);

  return (
    <Context.Provider value={confirm}>
      <ModalCard
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
        wrapperClassName={styles.card}
      >
        {options?.body}
      </ModalCard>
      {children}
    </Context.Provider>
  );
}

/**
 * A hook to easily create a configuration dialog.
 *
 * @param options The configuration options for the modal.
 * @returns A function which triggers the confirmation dialog when called.
 */
export function useConfirmation<T, A extends any[]>(
  options: ConfirmationOptions<T, A>,
): (...args: A) => Promise<Awaited<T>> {
  const confirm = useContext(Context);

  return useCallback((...args: A) => confirm(options, args), [confirm, options]);
}
