import classNames from 'classnames';
import { type ReactNode } from 'react';

import styles from './index.module.css';
import { ValuePickerProvider, type ValuePickerProviderProps } from '../index.js';

interface TabsProps<T> extends ValuePickerProviderProps<T> {
  /**
   * Make the tabs boxed.
   */
  readonly boxed?: boolean;

  /**
   * Center the tabs
   */
  readonly centered?: boolean;

  /**
   * An additional class name to apply to the root element.
   */
  readonly className?: string;

  /**
   * An additional id to apply to the root element.
   */
  readonly id?: string;

  /**
   * An optional size for the tabs
   */
  readonly size?: 'large' | 'medium' | 'small';
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
  id,
  size,
  ...props
}: TabsProps<T>): ReactNode {
  return (
    <div
      className={classNames(`tabs ${styles.root}`, className, {
        'is-boxed': boxed,
        'is-centered': centered,
        [`is-${size}`]: size,
      })}
      id={id}
    >
      <ul>
        <ValuePickerProvider {...props}>{children}</ValuePickerProvider>
      </ul>
    </div>
  );
}
