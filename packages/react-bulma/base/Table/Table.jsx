import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import { is } from '../../utils';

export default class Table extends React.Component {
  static propTypes = {
    bordered: PropTypes.bool,
    striped: PropTypes.bool,
    narrow: PropTypes.bool,
    hoverable: PropTypes.bool,
    fullwidth: PropTypes.bool,
    className: PropTypes.string,
    component: PropTypes.string,
  };

  static defaultProps = {
    bordered: false,
    striped: false,
    narrow: false,
    hoverable: false,
    fullwidth: false,
    className: null,
    component: 'table',
  };

  render() {
    const {
      bordered,
      striped,
      narrow,
      hoverable,
      fullwidth,
      className,
      component: Component,
      ...props
    } = this.props;

    return (
      <Component
        className={classNames(
          is('bordered', bordered),
          is('striped', striped),
          is('narrow', narrow),
          is('hoverable', hoverable),
          is('fullwidth', fullwidth),
          className,
        )}
        {...props}
      />
    );
  }
}
