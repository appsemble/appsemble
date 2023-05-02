import classNames from 'classnames';
import { type ComponentPropsWithoutRef, type ReactElement } from 'react';

/**
 * Render a simple Bulma box component.
 */
export function Box({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<'div'>): ReactElement {
  return (
    <div className={classNames('box', className)} {...props}>
      {children}
    </div>
  );
}
