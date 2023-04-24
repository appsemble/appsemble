import classNames from 'classnames';
import { type ComponentPropsWithoutRef, type ReactElement } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavLinkProps extends ComponentPropsWithoutRef<typeof Link> {
  /**
   * If specified, the link is only considered active if it’s an exact match.
   */
  exact?: boolean;
}

/**
 * A Bulma styles navigation link.
 */
export function NavLink({ className, exact, to, ...props }: NavLinkProps): ReactElement {
  const location = useLocation();

  return (
    <Link
      className={classNames(className, 'is-radiusless', {
        'is-active': location.pathname === to || (!exact && location.pathname.startsWith(`${to}/`)),
      })}
      to={to}
      {...props}
    />
  );
}
