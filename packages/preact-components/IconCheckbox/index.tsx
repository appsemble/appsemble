import { BulmaColor, BulmaSize } from '@appsemble/types';
import { IconName } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import { ComponentChild, ComponentProps, JSX } from 'preact';
import { forwardRef } from 'preact/compat';
import { useCallback } from 'preact/hooks';

import { Icon } from '../Icon/index.js';
import styles from './index.module.css';

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
   * Whether the component should render as a switch or as a square checkbox.
   */
  switch?: boolean;

  /**
   * Style options for when the checkbox is displaying as a switch.
   *
   * Does nothing if `switch` is set to `false`.
   */
  switchOptions?: {
    outlined?: boolean;
    thin?: boolean;
    rounded?: boolean;
  };

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
      rtl,
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
        <label className={classNames({ 'is-danger': error })} htmlFor={id}>
          {icon ? (
            <Icon
              className={classNames(styles[color], styles[size], {
                [`has-text-${color}`]: color && value,
              })}
              icon={icon as IconName}
            />
          ) : null}
          {label}
        </label>
      </span>
    );
  },
);
