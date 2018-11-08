import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

export default class CardHeaderTitle extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    component: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  };

  static defaultProps = {
    className: null,
    component: 'p',
  };

  render() {
    const { className, component: Component, ...props } = this.props;

    return <Component className={classNames('card-header-title', className)} {...props} />;
  }
}
