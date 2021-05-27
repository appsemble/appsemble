import classNames from 'classnames';
import { ChangeEvent, ComponentPropsWithoutRef, forwardRef, useCallback } from 'react';

export interface SelectProps extends Omit<ComponentPropsWithoutRef<'select'>, 'onChange'> {
  /**
   * Whether or not the select field has an error.
   */
  error?: unknown;

  /**
   * Whether or not the element should take as much space as it can.
   */
  fullWidth?: boolean;

  /**
   * Indicate the select box is in a loading state.
   */
  loading?: boolean;

  /**
   * This is fired when the input value has changed.
   */
  onChange?: (event: ChangeEvent<HTMLSelectElement>, value: string) => void;
}

/**
 * A Bulma styled form select element.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, fullWidth, loading, name, onChange, id = name, ...props }, ref) => {
    const handleChange = useCallback(
      (event: ChangeEvent<HTMLSelectElement>) => {
        onChange(event, event.currentTarget.value);
      },
      [onChange],
    );

    return (
      <div
        className={classNames('select', className, {
          'is-danger': error,
          'is-loading': loading,
          'is-fullwidth': fullWidth,
        })}
      >
        <select
          className={classNames({ 'is-fullwidth': fullWidth })}
          id={id}
          name={name}
          onChange={handleChange}
          ref={ref}
          {...props}
        />
      </div>
    );
  },
);
