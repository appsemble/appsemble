import classNames from 'classnames';
import React, { ReactElement } from 'react';

import { ValuePickerProvider, ValuePickerProviderProps } from '..';
import styles from './index.css';

interface TabsProps<T> extends ValuePickerProviderProps<T> {
  /**
   * Make the tabs boxed.
   */
  boxed?: boolean;

  /**
   * Center the tabs
   */
  centered?: boolean;

  /**
   * An additional class name to apply to the root element.
   */
  className?: string;

  /**
   * An optional size for the tabs
   */
  size?: 'small' | 'medium' | 'large';
}

/**
 * Render bulma styled tabs.
 *
 * The children should be `<Tab />` components.
 */
export function Tabs<T>({
  boxed,
  centered,
  children,
  className,
  size,
  ...props
}: TabsProps<T>): ReactElement {
  return (
    <div
      className={classNames(`tabs ${styles.root}`, className, {
        'is-boxed': boxed,
        'is-centered': centered,
        [`is-${size}`]: size,
      })}
    >
      <ul>
        <ValuePickerProvider {...props}>{children}</ValuePickerProvider>
      </ul>
    </div>
  );
}
