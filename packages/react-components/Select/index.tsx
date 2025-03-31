import classNames from 'classnames';
import { type ChangeEvent, type ComponentPropsWithoutRef, forwardRef, useCallback } from 'react';

export interface SelectProps extends Omit<ComponentPropsWithoutRef<'select'>, 'onChange'> {
  /**
   * Whether or not the select field has an error.
   */
  readonly error?: unknown;

  /**
   * Whether or not the element should take as much space as it can.
   */
  readonly fullWidth?: boolean;

  /**
   * Indicate the select box is in a loading state.
   */
  readonly loading?: boolean;

  /**
   * This is fired when the input value has changed.
   */
  readonly onChange?: (event: ChangeEvent<HTMLSelectElement>, value: string) => void;
}

/**
 * A Bulma styled form select element.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, error, fullWidth, loading, multiple, name, onChange, id = name, ...props },
    ref,
  ) => {
    const handleChange = useCallback(
      (event: ChangeEvent<HTMLSelectElement>) => {
        onChange?.(event, event.currentTarget.value);
      },
      [onChange],
    );

    return (
      <div
        className={classNames('select', className, {
          'is-danger': error,
          'is-loading': loading,
          'is-fullwidth': fullWidth,
          'is-multiple': multiple,
        })}
      >
        <select
          className={classNames({ 'is-fullwidth': fullWidth })}
          id={id}
          multiple={multiple}
          name={name}
          onChange={handleChange}
          ref={ref}
          {...props}
        />
      </div>
    );
  },
);
