import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import { is } from '../../utils';

export default class NavbarBurger extends React.Component {
  static propTypes = {
    active: PropTypes.bool,
    className: PropTypes.string,
    component: PropTypes.string,
    role: PropTypes.string,
  };

  static defaultProps = {
    active: false,
    className: null,
    component: 'div',
    role: 'button',
  };

  render() {
    const { active, className, component: Component, ...props } = this.props;

    return (
      <Component
        className={classNames('navbar-burger', is('active', active), className)}
        {...props}
      >
        <span />
        <span />
        <span />
      </Component>
    );
  }
}
