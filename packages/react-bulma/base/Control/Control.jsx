import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import { has } from '../../utils';


export default class Control extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    component: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.string,
    ]),
    iconsLeft: PropTypes.bool,
    iconsRight: PropTypes.bool,
  };

  static defaultProps = {
    className: null,
    component: 'div',
    iconsLeft: false,
    iconsRight: false,
  };

  render() {
    const {
      className,
      component: Component,
      iconsLeft,
      iconsRight,
      ...props
    } = this.props;

    return (
      <Component
        className={classNames(
          'control',
          has('icons-left', iconsLeft),
          has('icons-right', iconsRight),
          className,
        )}
        {...props}
      />
    );
  }
}
