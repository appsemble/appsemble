import classNames from 'classnames';
import { ComponentProps, h } from 'preact';
import { forwardRef } from 'preact/compat';
import { useCallback } from 'preact/hooks';

export interface SelectProps
  extends Omit<ComponentProps<'select'>, 'loading' | 'onChange' | 'onInput'> {
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
  onChange?: (event: h.JSX.TargetedEvent<HTMLSelectElement>, value: string) => void;
}

/**
 * A Bulma styled form select element.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, fullWidth, loading, name, onChange, id = name, ...props }, ref) => {
    const handleChange = useCallback(
      (event: h.JSX.TargetedEvent<HTMLSelectElement>) => {
        onChange(event, event.currentTarget.value);
      },
      [onChange],
    );

    return (
      <div
        className={classNames('select', className, {
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
