import classNames from 'classnames';
import React from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';

interface NavLinkProps {
  className: string;
  children: React.ReactChild[] | React.ReactChild;
  exact?: boolean;
  to: string;
}

export default function NavLink({
  location,
  className,
  exact,
  to,
  children,
}: NavLinkProps & RouteComponentProps): JSX.Element {
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
