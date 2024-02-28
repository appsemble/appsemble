import classNames from 'classnames';
import { type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { type Link, NavLink as NavigationLink } from 'react-router-dom';

interface NavLinkProps extends ComponentPropsWithoutRef<typeof Link> {
  /**
   * If specified, the link is only considered active if it’s an exact match.
   */
  readonly end?: boolean;
}

/**
 * A Bulma styles navigation link.
 */
export function NavLink({ className, end, to, ...props }: NavLinkProps): ReactNode {
  return (
    <NavigationLink
      className={({ isActive }: { isActive: boolean }) =>
        classNames(className, 'is-radiusless', isActive && 'is-active')
      }
      end={end}
      to={to}
      {...props}
    />
  );
}
