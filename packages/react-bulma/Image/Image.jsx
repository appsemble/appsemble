import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';


export default class Image extends React.Component {
  static propTypes = {
    alt: PropTypes.string.isRequired,
    className: PropTypes.string,
    component: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.string,
    ]),
    is: PropTypes.string,
    rounded: PropTypes.bool,
    src: PropTypes.string.isRequired,
  };

  static defaultProps = {
    className: null,
    component: 'figure',
    is: null,
    rounded: false,
  };

  render() {
    const {
      alt,
      className,
      component: Component,
      is,
      rounded,
      src,
      ...props
    } = this.props;

    const isClass = is == null ? null : `is-${is}x${is}`;

    return (
      <Component
        className={classNames('container', isClass, {
          'is-rounded': rounded,
        }, className)}
        {...props}
      >
        <img alt={alt} src={src} />
      </Component>
    );
  }
}
