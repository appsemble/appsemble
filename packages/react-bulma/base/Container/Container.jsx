import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

export default class Container extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    component: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  };

  static defaultProps = {
    className: null,
    component: 'div',
  };

  render() {
    const { className, component: Component, ...props } = this.props;

    return <Component className={classNames('container', className)} {...props} />;
  }
}
