import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';


export default class Fas extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    component: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.string,
    ]),
    fa: PropTypes.string.isRequired,
  };

  static defaultProps = {
    className: null,
    component: 'i',
  };

  render() {
    const {
      className,
      component: Component,
      fa,
      ...props
    } = this.props;

    return (
      <Component className={classNames('fas', `fa-${fa}`, className)} {...props} />
    );
  }
}
