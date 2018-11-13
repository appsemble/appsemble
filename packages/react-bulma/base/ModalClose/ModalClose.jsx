import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import { is } from '../../utils';

export default class ModalClose extends React.Component {
  static propTypes = {
    onClose: PropTypes.func,
    size: PropTypes.string,
    className: PropTypes.string,
    component: PropTypes.string,
  };

  static defaultProps = {
    onClose: null,
    size: null,
    className: null,
    component: 'button',
  };

  render() {
    const { className, component: Component, size, onClose, ...props } = this.props;

    return (
      <Component
        className={classNames('modal-close', is(size, size), className)}
        onClick={onClose}
        {...props}
      />
    );
  }
}
