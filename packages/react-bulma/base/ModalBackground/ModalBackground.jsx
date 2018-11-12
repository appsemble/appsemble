import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

export default class ModalBackground extends React.Component {
  static propTypes = {
    onClose: PropTypes.bool,
    className: PropTypes.string,
    component: PropTypes.string,
  };

  static defaultProps = {
    onClose: null,
    className: null,
    component: 'div',
  };

  render() {
    const { active, className, component: Component, onClose, ...props } = this.props;

    return (
      <Component
        className={classNames('modal-background', className)}
        onClick={onClose}
        {...props}
      />
    );
  }
}
