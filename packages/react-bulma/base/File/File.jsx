import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import { is } from '../../utils';


export default class File extends React.Component {
  static propTypes = {
    boxed: PropTypes.bool,
    className: PropTypes.string,
    color: PropTypes.string,
    component: PropTypes.string,
  };

  static defaultProps = {
    boxed: true,
    color: null,
    className: null,
    component: 'div',
  };

  render() {
    const {
      boxed,
      className,
      color,
      component: Component,
      ...props
    } = this.props;

    return (
      <Component
        className={classNames(
          'file',
          is(boxed),
          is(color),
          className,
        )}
        {...props}
      />
    );
  }
}
