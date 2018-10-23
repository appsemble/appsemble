import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import { is } from '../../utils';

export default class Button extends React.Component {
  static propTypes = {
    active: PropTypes.bool,
    className: PropTypes.string,
    color: PropTypes.string,
    component: PropTypes.string,
    loading: PropTypes.bool,
    size: PropTypes.string,
    type: PropTypes.string,
  };

  static defaultProps = {
    active: false,
    color: null,
    className: null,
    component: 'button',
    loading: false,
    size: null,
    type: 'button',
  };

  render() {
    const { active, className, color, component: Component, loading, size, ...props } = this.props;

    return (
      <Component
        className={classNames(
          'button',
          is(color),
          is('active', active),
          is('loading', loading),
          is(size),
          className,
        )}
        {...props}
      />
    );
  }
}
