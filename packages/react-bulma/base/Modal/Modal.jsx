import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import { is } from '../../utils';

export default class Modal extends React.Component {
  static propTypes = {
    active: PropTypes.bool,
    onClose: PropTypes.func,
    className: PropTypes.string,
    component: PropTypes.string,
  };

  static defaultProps = {
    active: false,
    className: null,
    component: 'div',
    onClose: null,
  };

  render() {
    const { active, className, component: Component, onClose, ...props } = this.props;

    return (
      <Component className={classNames('modal', is('active', active), className)}>
        <Component className={classNames('modal-background')} onClick={onClose} />
        <Component className={classNames('modal-content')} {...props} />
        <button className={classNames('modal-close', 'is-large')} onClick={onClose} type="button" />
      </Component>
    );
  }
}
