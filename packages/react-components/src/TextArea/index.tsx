import classNames from 'classnames';
import React, { ChangeEvent, ComponentPropsWithoutRef, forwardRef, useCallback } from 'react';

export interface TextAreaProps
  extends Omit<ComponentPropsWithoutRef<'textarea'>, 'label' | 'onChange'> {
  /**
   * Whether to render the input in an error state.
   */
  error?: boolean;

  /**
   * This is fired when the input value has changed.
   *
   * If the input type is `checkbox`, the value is a boolean. If the input type is `number`, the
   * value is a number, otherwise it is a string.
   */
  onChange?: (event: ChangeEvent<HTMLTextAreaElement>, value: string) => void;
}

/**
 * A Bulma styled textarea element.
 */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ error, name, onChange, id = name, ...props }, ref) => {
    const handleChange = useCallback(
      (event: ChangeEvent<HTMLTextAreaElement>) => {
        onChange(event, event.currentTarget.value);
      },
      [onChange],
    );

    return (
      <textarea
        {...props}
        className={classNames('textarea', { 'is-danger': error })}
        id={id}
        name={name}
        onChange={handleChange}
        ref={ref}
      />
    );
  },
);
