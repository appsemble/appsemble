import {
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  type ReactNode,
  useCallback,
} from 'react';

import { useValuePicker } from '../index.js';

interface RadioButtonProps<T>
  extends Omit<ComponentPropsWithoutRef<'input'>, 'name' | 'onChange' | 'value'> {
  /**
   * The node to render as a label.
   */
  readonly children: ReactNode;

  /**
   * The value represented by this radio button.
   */
  readonly value: T;

  /**
   * A function which returns how to represent the value in the DOM.
   */
  readonly valueToString?: (value: T) => string;

  /**
   * The class used for the wrapper div.
   */
  readonly wrapperClassName?: string;
}

/**
 * A Bulma styled form select element.
 */
export function RadioButton<T>({
  children,
  id,
  value,
  valueToString = JSON.stringify,
  wrapperClassName,
  ...props
}: RadioButtonProps<T>): ReactNode {
  const { name, onChange, value: currentValue } = useValuePicker();

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => onChange(event, value),
    [onChange, value],
  );

  return (
    <div className={wrapperClassName}>
      <input
        {...props}
        checked={value === currentValue}
        className="is-checkradio"
        id={id}
        name={name}
        onChange={handleChange}
        type="radio"
        value={valueToString(value)}
      />
      <label htmlFor={id}>{children}</label>
    </div>
  );
}
