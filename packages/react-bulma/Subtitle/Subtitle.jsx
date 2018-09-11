import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import { is } from '../utils';


export default class Subtitle extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    size: PropTypes.number.isRequired,
  };

  static defaultProps = {
    className: null,
  };

  render() {
    const {
      className,
      size,
      ...props
    } = this.props;

    const Component = `h${size}`;

    return <Component className={classNames('subtitle', is(size), className)} {...props} />;
  }
}
