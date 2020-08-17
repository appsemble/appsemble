import { h, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import type { Props } from '..';

interface FormProps extends Omit<Props<'form'>, 'noValidate'> {
  /**
   * The submit event handler for the form.
   */
  onSubmit: (event: Event) => void;
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
