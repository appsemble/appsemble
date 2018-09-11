import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import { is } from '../utils';


export default class Message extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    color: PropTypes.string,
    component: PropTypes.string,
  };

  static defaultProps = {
    color: null,
    className: null,
    component: 'article',
  };

  render() {
    const {
      className,
      color,
      component: Component,
      ...props
    } = this.props;

    return (
      <Component
        className={classNames(
          'message',
          is(color),
          className,
        )}
        {...props}
      />
    );
  }
}
