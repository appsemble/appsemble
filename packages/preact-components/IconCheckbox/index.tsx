import { type BulmaColor, type BulmaSize } from '@appsemble/types';
import { type IconName } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import { type ComponentChild, type ComponentProps, type JSX } from 'preact';
import { forwardRef } from 'preact/compat';
import { useCallback } from 'preact/hooks';

import styles from './index.module.css';
import { Icon } from '../Icon/index.js';

type CheckboxProps = Omit<
  ComponentProps<'input'>,
  'label' | 'onChange' | 'onInput' | 'size' | 'title' | 'value'
> & {
  /**
   * If true, render an error color.
   */
  error?: boolean;

  /**
   * This is fired when the input value has changed.
   */
  onChange: (event: JSX.TargetedEvent<HTMLInputElement>, value: boolean) => void;

  /**
   * The title to display right of the checkbox.
   */
  label?: ComponentChild;

  /**
   * Whether or not the checkbox is checked.
   */
  value?: boolean;

  /**
   * The color of the checkbox.
   */
  color?: BulmaColor;

  /**
   * The size of the checkbox.
   *
   * @default 'normal'
   */
  size?: BulmaSize;

  icon?: IconName;
};

/**
 * A Bulma styled form select element.
 */
export const IconCheckbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      error,
      label,
      name,
      onChange,
      value,
      id = name,
      size = 'normal',
      color,
      icon,
      ...props
    },
    ref,
  ) => {
    const handleChange = useCallback(
      (event: JSX.TargetedEvent<HTMLInputElement>) => {
        onChange(event, event.currentTarget.checked);
      },
      [onChange],
    );

    return (
      <span className={className}>
        <input
          {...props}
          checked={value}
          className={styles.checkbox}
          id={id}
          name={name}
          onChange={handleChange}
          ref={ref}
          type="checkbox"
        />
        <label className={classNames(styles[size], styles[color])} htmlFor={id}>
          {icon ? <Icon icon={icon as IconName} /> : null}
          {label}
        </label>
      </span>
    );
  },
);
