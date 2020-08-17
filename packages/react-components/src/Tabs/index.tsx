import classNames from 'classnames';
import React, { ReactElement } from 'react';

import { ValuePickerProvider, ValuePickerProviderProps } from '..';

interface TabsProps<T> extends ValuePickerProviderProps<T> {
  /**
   * Make the tabs boxed.
   */
  boxed?: boolean;

  /**
   * An additional class name to apply to the root element.
   */
  className?: string;
}

/**
 * Render bulma styled tabs.
 *
 * The children should be `<Tab />` components.
 */
export function Tabs<T>({ boxed, children, className, ...props }: TabsProps<T>): ReactElement {
  return (
    <div className={classNames('tabs', className, { 'is-boxed': boxed })}>
      <ul>
        <ValuePickerProvider {...props}>{children}</ValuePickerProvider>
      </ul>
    </div>
  );
}
