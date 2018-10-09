import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import { is } from '../../utils';

export default class Textarea extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    color: PropTypes.string,
    component: PropTypes.string,
    size: PropTypes.string,
  };

  static defaultProps = {
    color: null,
    className: null,
    component: 'textarea',
    size: null,
  };

  render() {
    const { className, color, component: Component, size, ...props } = this.props;

    return (
      <Component className={classNames('textarea', is(color), is(size), className)} {...props} />
    );
  }
}
