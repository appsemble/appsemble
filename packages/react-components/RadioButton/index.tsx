import { ChangeEvent, ComponentPropsWithoutRef, ReactElement, ReactNode, useCallback } from 'react';

import { useValuePicker } from '../index.js';

interface RadioButtonProps<T>
  extends Omit<ComponentPropsWithoutRef<'input'>, 'name' | 'onChange' | 'value'> {
  /**
   * The node to render as a label.
   */
  children: ReactNode;

  /**
   * The value represented by this radio button.
   */
  value: T;

  /**
   * A function which returns how to represent the value in the DOM.
   */
  valueToString?: (value: T) => string;

  /**
   * The class used for the wrapper div.
   */
  wrapperClassName?: string;
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
}: RadioButtonProps<T>): ReactElement {
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
