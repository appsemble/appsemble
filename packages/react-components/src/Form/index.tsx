import * as React from 'react';

interface FormProps extends Omit<React.ComponentPropsWithoutRef<'form'>, 'noValidate'> {
  /**
   * The submit event handler for the form.
   */
  onSubmit: React.FormEventHandler<HTMLFormElement>;
}

/**
 * A simple form wrapper that ensures `noValidate` is passed and `onSubmit` is used.
 */
export default function Form({ onSubmit, ...props }: FormProps): React.ReactElement {
  const handleSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      onSubmit(event);
    },
    [onSubmit],
  );

  return <form onSubmit={handleSubmit} {...props} noValidate />;
}
