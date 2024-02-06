import {
  type ComponentPropsWithoutRef,
  type FormEvent,
  type FormEventHandler,
  type ReactNode,
  useCallback,
} from 'react';

interface FormProps extends Omit<ComponentPropsWithoutRef<'form'>, 'noValidate'> {
  /**
   * The submit event handler for the form.
   */
  readonly onSubmit: FormEventHandler<HTMLFormElement>;
}

/**
 * A simple form wrapper that ensures `noValidate` is passed and `onSubmit` is used.
 */
export function Form({ onSubmit, ...props }: FormProps): ReactNode {
  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      onSubmit(event);
    },
    [onSubmit],
  );

  return <form onSubmit={handleSubmit} {...props} noValidate />;
}
