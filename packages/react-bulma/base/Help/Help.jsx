import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import { is } from '../../utils';

export default class Help extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    color: PropTypes.string,
    component: PropTypes.string,
  };

  static defaultProps = {
    className: null,
    color: null,
    component: 'p',
  };

  render() {
    const { className, color, component: Component, ...props } = this.props;

    return <Component className={classNames('help', is(color), className)} {...props} />;
  }
}
