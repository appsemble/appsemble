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
    imgProps: PropTypes.shape(),
    rounded: PropTypes.bool,
    size: PropTypes.number,
    src: PropTypes.string.isRequired,
    square: PropTypes.bool,
  };

  static defaultProps = {
    className: null,
    component: 'figure',
    imgProps: {},
    rounded: false,
    size: null,
    square: false,
  };

  render() {
    const {
      alt,
      className,
      component: Component,
      imgProps,
      rounded,
      size,
      src,
      square,
      ...props
    } = this.props;

    return (
      <Component
        className={classNames(
          'image',
          is(`${size}x${size}`, size),
          is('rounded', rounded),
          is('square', square),
          className,
        )}
        {...props}
      >
        <img alt={alt} src={src} {...imgProps} />
      </Component>
    );
  }
}
