import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import { is } from '../../utils';


export default class Image extends React.Component {
  static propTypes = {
    alt: PropTypes.string.isRequired,
    className: PropTypes.string,
    component: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.string,
    ]),
    rounded: PropTypes.bool,
    size: PropTypes.number,
    src: PropTypes.string.isRequired,
  };

  static defaultProps = {
    className: null,
    component: 'figure',
    rounded: false,
    size: null,
  };

  render() {
    const {
      alt,
      className,
      component: Component,
      rounded,
      size,
      src,
      ...props
    } = this.props;

    const sizeClass = size == null ? null : `is-${size}x${size}`;

    return (
      <Component
        className={classNames('image', sizeClass, is(rounded), className)}
        {...props}
      >
        <img alt={alt} src={src} />
      </Component>
    );
  }
}
