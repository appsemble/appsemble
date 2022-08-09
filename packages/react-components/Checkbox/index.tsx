import classNames from 'classnames';
import {
  ChangeEvent,
  ComponentPropsWithoutRef,
  forwardRef,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
} from 'react';

import { useCombinedRefs } from '../index.js';

type CheckboxProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  'label' | 'onChange' | 'title' | 'value'
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

  /**
   * Sets the indeterminate state on the checkbox.
   */
  indeterminate?: boolean;
};

/**
 * A Bulma styled form select element.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      error,
      label,
      name,
      onChange,
      value,
      id = name,
      switch: isSwitch,
      indeterminate,
      rtl,
      ...props
    },
    ref,
  ) => {
    const innerRef = useRef<HTMLInputElement>();
    const mergedRef = useCombinedRefs(innerRef, ref);

    const handleChange = useCallback(
      (event: ChangeEvent<HTMLInputElement>) => {
        onChange(event, event.currentTarget.checked);
      },
      [onChange],
    );

    useEffect(() => {
      innerRef.current.indeterminate = indeterminate;
    }, [indeterminate]);

    return (
      <span className={className}>
        <input
          {...props}
          checked={value}
          className={classNames(isSwitch ? 'switch' : 'is-checkradio', { 'is-rtl': rtl })}
          id={id}
          name={name}
          onChange={handleChange}
          ref={mergedRef}
          type="checkbox"
        />
        <label className={classNames({ 'is-danger': error })} htmlFor={id}>
          {label}
        </label>
      </span>
    );
  },
);
