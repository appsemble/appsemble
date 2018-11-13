import PropTypes from 'prop-types';
import React from 'react';

import { ModalBackground, ModalClose, ModalContainer, ModalContent } from '../../base';

export default class Modal extends React.Component {
  static propTypes = {
    ModalProps: PropTypes.shape(),
    ModalBackgroundProps: PropTypes.shape(),
    ModalCloseProps: PropTypes.shape(),
    ModalContentProps: PropTypes.shape(),
    active: PropTypes.bool,
    onClose: PropTypes.func,
  };

  static defaultProps = {
    ModalProps: {},
    ModalBackgroundProps: {},
    ModalCloseProps: {},
    ModalContentProps: {},
    active: false,
    onClose: null,
  };

  render() {
    const {
      ModalProps,
      ModalBackgroundProps,
      ModalCloseProps,
      ModalContentProps,
      active,
      onClose,
      children,
      ...props
    } = this.props;

    return (
      <ModalContainer {...props} {...ModalProps} active={active}>
        <ModalBackground {...ModalBackgroundProps} onClick={onClose} />
        <ModalContent {...ModalContentProps}>{children}</ModalContent>
        <ModalClose {...ModalCloseProps} onClick={onClose} />
      </ModalContainer>
    );
  }
}
