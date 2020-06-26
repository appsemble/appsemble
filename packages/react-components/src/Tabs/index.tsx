import classNames from 'classnames';
import * as React from 'react';

import ValuePickerProvider, { ValuePickerProviderProps } from '../ValuePickerProvider';

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
export default function Tabs<T>({
  boxed,
  children,
  className,
  ...props
}: TabsProps<T>): React.ReactElement {
  return (
    <div className={classNames('tabs', className, { 'is-boxed': boxed })}>
      <ul>
        <ValuePickerProvider {...props}>{children}</ValuePickerProvider>
      </ul>
    </div>
  );
}
