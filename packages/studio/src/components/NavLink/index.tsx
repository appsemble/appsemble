import classNames from 'classnames';
import React, { ReactChild, ReactElement } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavLinkProps {
  className?: string;
  children: ReactChild[] | ReactChild;
  exact?: boolean;
  to: string;
}

export function NavLink({ children, className, exact, to }: NavLinkProps): ReactElement {
  const location = useLocation();

  return (
    <Link
      className={classNames(className, 'is-radiusless', {
        'is-active': location.pathname === to || (!exact && location.pathname.startsWith(`${to}/`)),
      })}
      to={to}
    >
      {children}
    </Link>
  );
}
