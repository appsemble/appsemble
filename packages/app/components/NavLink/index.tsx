import classNames from 'classnames';
import { type VNode } from 'preact';
import {
  NavLink as NavigationLink,
  type NavLinkProps as RouterNavLinkProps,
} from 'react-router-dom';

interface NavLinkProps extends Omit<RouterNavLinkProps, 'className'> {
  /**
   * The CSS class to apply to the link.
   */
  readonly className?: string;

  /**
   * If specified, the link is only considered active if it’s an exact match.
   */
  readonly end?: boolean;
}

/**
 * A Bulma styles navigation link.
 */
export function NavLink({ className, end, to, ...props }: NavLinkProps): VNode {
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
