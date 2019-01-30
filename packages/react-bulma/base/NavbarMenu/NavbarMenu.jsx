import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import { is } from '../../utils';

export default class NavbarMenu extends React.Component {
  static propTypes = {
    active: PropTypes.bool,
    className: PropTypes.string,
    component: PropTypes.string,
  };

  static defaultProps = {
    active: false,
    className: null,
    component: 'div',
  };

  render() {
    const { active, className, component: Component, ...props } = this.props;

    return (
      <Component
        className={classNames('navbar-menu', is('active', active), className)}
        {...props}
      />
    );
  }
}
