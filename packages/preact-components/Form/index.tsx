import { type ComponentProps, type VNode } from 'preact';
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
export function Form({ onSubmit, ...props }: FormProps): VNode {
  const handleSubmit = useCallback(
    (event: Event) => {
      event.preventDefault();
      onSubmit(event);
    },
    [onSubmit],
  );

  return <form onSubmit={handleSubmit} {...props} noValidate />;
}
