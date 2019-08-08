import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router-dom';

export default class NavLink extends React.Component {
  static propTypes = {
    location: PropTypes.shape().isRequired,
    className: PropTypes.string,
    exact: PropTypes.bool,
    to: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
  };

  static defaultProps = {
    exact: false,
    className: null,
  };

  render() {
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
