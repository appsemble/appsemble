import { type ComponentProps } from 'preact';
import { forwardRef } from 'preact/compat';
import { useCallback } from 'preact/hooks';

interface FormProps extends Omit<ComponentProps<'form'>, 'noValidate'> {
  /**
   * The submit event handler for the form.
   */
  readonly onSubmit: (event: Event) => void;
}

/**
 * A simple form wrapper that ensures `noValidate` is passed and `onSubmit` is used.
 */
export const Form = forwardRef<HTMLFormElement, FormProps>(({ onSubmit, ...props }, ref) => {
  const handleSubmit = useCallback(
    (event: Event) => {
      event.preventDefault();
      onSubmit(event);
    },
    [onSubmit],
  );

  return <form onSubmit={handleSubmit} ref={ref} {...props} noValidate />;
});
