import classNames from 'classnames';
import {
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  forwardRef,
  type ReactNode,
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
  readonly error?: boolean;

  /**
   * This is fired when the input value has changed.
   */
  readonly onChange: (event: ChangeEvent<HTMLInputElement>, value: boolean) => void;

  /**
   * The title to display right of the checkbox.
   */
  readonly label?: ReactNode;

  /**
   * Whether or not the checkbox is checked.
   */
  readonly value?: boolean;

  /**
   * Whether the component should render as a switch or as a square checkbox.
   */
  readonly switch?: boolean;

  /**
   * Whether the label should be displayed to the right of the checkbox or to the left.
   *
   * By default (false), the label will be rendered after the checkbox.
   */
  readonly rtl?: boolean;

  /**
   * Sets the indeterminate state on the checkbox.
   */
  readonly indeterminate?: boolean;
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
    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
    // @ts-ignore 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
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
