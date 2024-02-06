import classNames from 'classnames';
import { type ComponentPropsWithoutRef, type ReactNode } from 'react';

/**
 * Render a simple Bulma box component.
 */
export function Box({ children, className, ...props }: ComponentPropsWithoutRef<'div'>): ReactNode {
  return (
    <div className={classNames('box', className)} {...props}>
      {children}
    </div>
  );
}
