import classNames from 'classnames';
import { format } from 'date-fns';
import React, { ChangeEvent, ComponentPropsWithoutRef, forwardRef, useCallback } from 'react';

export interface InputProps extends Omit<ComponentPropsWithoutRef<'input'>, 'label' | 'onChange'> {
  /**
   * Whether to render the input in an error state.
   */
  error?: boolean;

  /**
   * This is fired when the input value has changed.
   *
   * If the input type is `number`, the value is a number, otherwise it is a string.
   */
  onChange?: (event: ChangeEvent<HTMLInputElement>, value: number | string) => void;

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
  ({ error, name, onChange, type, value, id = name, ...props }, ref) => {
    const handleChange = useCallback(
      (event: ChangeEvent<HTMLInputElement>) => {
        const { currentTarget } = event;
        let newValue: number | string;
        if (type === 'number') {
          newValue = currentTarget.valueAsNumber;
        } else if (type === 'date' || type === 'datetime-local') {
          newValue = new Date(
            currentTarget.valueAsNumber + new Date().getTimezoneOffset() * 60000,
          ).toISOString();
        } else {
          newValue = currentTarget.value;
        }
        onChange(event, newValue);
      },
      [onChange, type],
    );

    return (
      <input
        {...props}
        className={classNames('input', { 'is-danger': error })}
        id={id}
        name={name}
        onChange={handleChange}
        ref={ref}
        type={type}
        value={
          type === 'datetime-local'
            ? format(new Date((value as number) || Date.now()), "yyyy-MM-dd'T'HH:mm:ss.SSS")
            : value
        }
      />
    );
  },
);
