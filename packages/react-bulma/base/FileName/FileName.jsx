import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

export default class FileName extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    component: PropTypes.string,
  };

  static defaultProps = {
    className: null,
    component: 'span',
  };

  render() {
    const { boxed, className, color, component: Component, ...props } = this.props;

    return <Component className={classNames('file-name', className)} {...props} />;
  }
}
