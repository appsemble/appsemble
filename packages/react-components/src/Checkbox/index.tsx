import classNames from 'classnames';
import React, {
  ChangeEvent,
  ComponentPropsWithoutRef,
  forwardRef,
  ReactElement,
  ReactNode,
  useCallback,
} from 'react';

type CheckboxProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  'value' | 'label' | 'onChange' | 'title'
> & {
  /**
   * If true, tender an error color.
   */
  error?: boolean;

  /**
   * This is fired when the input value has changed.
   */
  onChange: (event: ChangeEvent<HTMLInputElement>, value: boolean) => void;

  /**
   * The title to display right of the checkbox.
   */
  label?: ReactNode;

  /**
   * Whether or not the checkbox is checked.
   */
  value?: boolean;

  /**
   * Whether the component should render as a switch or as a square checkbox.
   */
  switch?: boolean;

  /**
   * Whether the label should be displayed to the right of the checkbox or to the left.
   *
   * By default (false), the label will be rendered after the checkbox.
   */
  rtl?: boolean;
};

/**
 * A Bulma styled form select element.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    { className, error, label, name, onChange, value, id = name, switch: isSwitch, rtl, ...props },
    ref,
  ): ReactElement => {
    const handleChange = useCallback(
      (event: ChangeEvent<HTMLInputElement>) => {
        onChange(event, event.currentTarget.checked);
      },
      [onChange],
    );

    return (
      <span className={className}>
        <input
          {...props}
          checked={value}
          className={classNames(isSwitch ? 'switch' : 'is-checkradio', { 'is-rtl': rtl })}
          id={id}
          name={name}
          onChange={handleChange}
          ref={ref}
          type="checkbox"
        />
        <label className={classNames({ 'is-danger': error })} htmlFor={id}>
          {label}
        </label>
      </span>
    );
  },
);
