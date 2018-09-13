import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import { is } from '../../utils';


export default class Field extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    component: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.string,
    ]),
    horizontal: PropTypes.bool,
  };

  static defaultProps = {
    className: null,
    component: 'div',
    horizontal: false,
  };

  render() {
    const {
      className,
      component: Component,
      horizontal,
      ...props
    } = this.props;

    return (
      <Component
        className={classNames(
          'field',
          is('horizontal', horizontal),
          className,
        )}
        {...props}
      />
    );
  }
}
