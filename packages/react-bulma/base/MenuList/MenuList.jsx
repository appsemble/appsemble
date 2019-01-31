import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

export default class MenuList extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    component: PropTypes.string,
  };

  static defaultProps = {
    className: null,
    component: 'ul',
  };

  render() {
    const { className, component: Component, ...props } = this.props;

    return <Component className={classNames('menu-list', className)} {...props} />;
  }
}
