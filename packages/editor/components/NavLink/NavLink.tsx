import classNames from 'classnames';
import React from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';

interface NavLinkProps {
  className: string;
  children: React.ReactChild;
  exact: boolean;
  to: string;
}

export default class NavLink extends React.Component<NavLinkProps & RouteComponentProps> {
  render(): JSX.Element {
    const { location, className, exact, to, children } = this.props;

    return (
      <Link
        className={classNames(className, 'is-radiusless', {
          'is-active':
            location.pathname === to || (!exact && location.pathname.startsWith(`${to}/`)),
        })}
        to={to}
      >
        {children}
      </Link>
    );
  }
}
