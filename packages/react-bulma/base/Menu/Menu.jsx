import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

export default class Menu extends React.Component {
  static propTypes = {
    component: PropTypes.string,
  };

  static defaultProps = {
    component: 'aside',
  };

  render() {
    const { className, component: Component, ...props } = this.props;

    return <Component className={classNames('menu', className)} {...props} />;
  }
}
