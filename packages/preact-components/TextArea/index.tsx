import classNames from 'classnames';
import { type ComponentProps, type JSX } from 'preact';
import { forwardRef } from 'preact/compat';
import { type MutableRef, useCallback } from 'preact/hooks';

import { useCombinedRefs } from '../useCombinedRefs.js';

export interface TextAreaProps
  extends Omit<ComponentProps<'textarea'>, 'label' | 'loading' | 'onChange' | 'onInput'> {
  /**
   * Whether to render the input in an error state.
   */
  error?: boolean;

  /**
   * Indicate the text area is in a loading state.
   */
  loading?: boolean;

  /**
   * This is fired when the input value has changed.
   */
  onChange?: (event: JSX.TargetedEvent<HTMLTextAreaElement>, value: string) => void;

  /**
   * The ref to use for the error link
   */
  readonly errorLinkRef?: MutableRef<HTMLElement>;
}

/**
 * A Bulma styled textarea element.
 */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ errorLinkRef, error, name, loading, onChange, readOnly, id = name, ...props }, ref) => {
    const handleChange = useCallback(
      (event: JSX.TargetedEvent<HTMLTextAreaElement>) => {
        onChange?.(event, event.currentTarget.value);
      },
      [onChange],
    );

    const combinedRef = useCombinedRefs(
      ref as MutableRef<HTMLTextAreaElement>,
      errorLinkRef as MutableRef<HTMLElement>,
    );

    return (
      <textarea
        {...props}
        className={classNames('textarea', {
          'has-background-white-bis': readOnly,
          'is-danger': error,
          'is-loading': loading,
        })}
        id={id}
        name={name}
        onChange={handleChange}
        readOnly={readOnly}
        ref={combinedRef}
      />
    );
  },
);
