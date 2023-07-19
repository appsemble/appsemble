import { type IconName } from '@fortawesome/fontawesome-common-types';
import { type ComponentChild, type JSX, type VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import styles from './index.module.css';
import { Icon, useValuePicker } from '../index.js';

interface RadioButtonProps<T>
  extends Omit<JSX.HTMLAttributes<HTMLInputElement>, 'name' | 'onChange' | 'value'> {
  /**
   * The node to render as a label.
   */
  children: ComponentChild;

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
  icon,
  id,
  value,
  valueToString = JSON.stringify,
  wrapperClassName,
  ...props
}: RadioButtonProps<T>): VNode {
  const { name, onChange, value: currentValue } = useValuePicker();

  const handleChange = useCallback(
    (event: JSX.TargetedEvent<HTMLInputElement>) => onChange(event, value),
    [onChange, value],
  );
  const handleClick = useCallback((event: JSX.TargetedEvent<HTMLInputElement>) => {
    const radioButton = event.target as HTMLInputElement;
    if (radioButton.readOnly) {
      event.preventDefault();
    }
  }, []);

  return (
    <div className={wrapperClassName}>
      <input
        {...props}
        checked={value === currentValue}
        className={icon ? styles.iconradio : 'is-checkradio'}
        id={id}
        name={name}
        onChange={handleChange}
        onClick={handleClick}
        type="radio"
        value={valueToString(value)}
      />
      <label htmlFor={id}>
        {icon ? <Icon className={styles.icon} icon={icon as IconName} /> : null}
        {children}
      </label>
    </div>
  );
}
