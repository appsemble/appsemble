import classNames from 'classnames';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavLinkProps {
  className?: string;
  children: React.ReactChild[] | React.ReactChild;
  exact?: boolean;
  to: string;
}

export default function NavLink({
  children,
  className,
  exact,
  to,
}: NavLinkProps): React.ReactElement {
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
