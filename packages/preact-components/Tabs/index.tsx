import classNames from 'classnames';
import { type VNode } from 'preact';

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
}: TabsProps<T>): VNode {
  return (
    <div
      className={classNames(`tabs ${styles.root}`, className, {
        'is-boxed': boxed,
        'is-centered': centered,
        [`is-${size}`]: size,
      })}
      id={id}
    >
      <ValuePickerProvider {...props}>
        <ul>{children}</ul>
      </ValuePickerProvider>
    </div>
  );
}
