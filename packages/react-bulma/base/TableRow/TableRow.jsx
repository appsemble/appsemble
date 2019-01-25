import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import { is } from '../../utils';

export default class TableRow extends React.Component {
  static propTypes = {
    selected: PropTypes.bool,
    className: PropTypes.string,
    component: PropTypes.string,
  };

  static defaultProps = {
    selected: false,
    className: null,
    component: 'tr',
  };

  render() {
    const { selected, className, component: Component, ...props } = this.props;

    return <Component className={classNames(is('selected', selected), className)} {...props} />;
  }
}
