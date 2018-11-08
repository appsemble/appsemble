import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

export default class CardFooter extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    component: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  };

  static defaultProps = {
    className: null,
    component: 'footer',
  };

  render() {
    const { className, component: Component, ...props } = this.props;

    return <Component className={classNames('card-footer', className)} {...props} />;
  }
}
