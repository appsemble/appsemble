import classNames from 'classnames';
import React, { ChangeEvent, ComponentPropsWithoutRef, forwardRef, useCallback } from 'react';

export interface InputProps
  extends Omit<ComponentPropsWithoutRef<'input'>, 'label' | 'loading' | 'onChange' | 'pattern'> {
  /**
   * Whether to render the input in an error state.
   */
  error?: boolean;

  /**
   * Indicate the select box is in a loading state.
   */
  loading?: boolean;

  /**
   * This is fired when the input value has changed.
   *
   * If the input type is `number`, the value is a number, otherwise it is a string.
   */
  onChange?: (event: ChangeEvent<HTMLInputElement>, value: number | string) => void;

  /**
   * A regular expression the input must match.
   */
  pattern?: string | RegExp;

  /**
   * The HTML input type.
   *
   * This may be extended if necessary.
   */
  type?:
    | 'color'
    | 'email'
    | 'number'
    | 'password'
    | 'search'
    | 'tel'
    | 'text'
    | 'url'
    | 'date'
    | 'datetime-local';
}

/**
 * A Bulma styled form input element.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, loading, name, onChange, pattern, type, id = name, ...props }, ref) => {
    const handleChange = useCallback(
      (event: ChangeEvent<HTMLInputElement>) => {
        const { currentTarget } = event;
        onChange(event, type === 'number' ? currentTarget.valueAsNumber : currentTarget.value);
      },
      [onChange, type],
    );

    return (
      <input
        {...props}
        className={classNames('input', { 'is-danger': error, 'is-loading': loading })}
        id={id}
        name={name}
        onChange={handleChange}
        pattern={pattern instanceof RegExp ? pattern.source : pattern}
        ref={ref}
        type={type}
      />
    );
  },
);
