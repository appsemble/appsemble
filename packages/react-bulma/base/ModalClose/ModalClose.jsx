import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import { is } from '../../utils';

export default class ModalClose extends React.Component {
  static propTypes = {
    size: PropTypes.string,
    className: PropTypes.string,
    component: PropTypes.string,
    type: PropTypes.string,
  };

  static defaultProps = {
    size: null,
    className: null,
    component: 'button',
    type: 'button',
  };

  render() {
    const { className, component: Component, size, ...props } = this.props;

    return (
      <Component className={classNames('modal-close', is(size, size), className)} {...props} />
    );
  }
}
