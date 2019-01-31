import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import { is } from '../../utils';

export default class Navbar extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    color: PropTypes.string,
    component: PropTypes.string,
    fixed: PropTypes.string,
  };

  static defaultProps = {
    className: null,
    color: null,
    component: 'nav',
    fixed: null,
  };

  render() {
    const { className, color, component: Component, fixed, ...props } = this.props;

    return (
      <Component
        className={classNames(
          'navbar',
          is('fixed-bottom', fixed === 'bottom'),
          is('fixed-top', fixed === 'top'),
          is(color),
          className,
        )}
        {...props}
      />
    );
  }
}
