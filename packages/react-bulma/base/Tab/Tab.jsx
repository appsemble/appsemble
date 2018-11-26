import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import { is } from '../../utils';

export default class Tab extends React.Component {
  static propTypes = {
    boxed: PropTypes.bool,
    centered: PropTypes.bool,
    className: PropTypes.string,
    component: PropTypes.string,
    fullWidth: PropTypes.bool,
    right: PropTypes.bool,
    size: PropTypes.string,
    toggle: PropTypes.bool,
    toggleRounded: PropTypes.bool,
  };

  static defaultProps = {
    boxed: false,
    centered: false,
    className: null,
    component: 'div',
    fullWidth: false,
    right: false,
    size: null,
    toggle: false,
    toggleRounded: false,
  };

  render() {
    const {
      boxed,
      centered,
      className,
      component: Component,
      fullWidth,
      right,
      size,
      toggle,
      toggleRounded,
      children,
      ...props
    } = this.props;

    return (
      <Component
        className={classNames(
          'tabs',
          is('boxed', boxed),
          is('centered', centered),
          is('right', right),
          is('toggle', toggle),
          is('toggle-rounded', toggleRounded),
          is('fullwidth', fullWidth),
          is(size),
          className,
        )}
        {...props}
      >
        <ul>{children}</ul>
      </Component>
    );
  }
}
