import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import { is } from '../../utils';

export default class FieldLabel extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    component: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
    normal: PropTypes.bool,
  };

  static defaultProps = {
    className: null,
    component: 'div',
    normal: false,
  };

  render() {
    const { className, component: Component, normal, ...props } = this.props;

    return (
      <Component
        className={classNames('field-label', is('normal', normal), className)}
        {...props}
      />
    );
  }
}
