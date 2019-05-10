import classNames from 'classnames';
import * as PropTypes from 'prop-types';
import * as React from 'react';
import { InjectedIntlProps, intlShape } from 'react-intl';
import { CSSTransition } from 'react-transition-group';

import messages from './messages';
import styles from './Modal.css';

interface ModalProps {
  /**
   * The child elements to render on the modal.
   */
  children?: React.ReactNode;
  /**
   * Wether or not the modal is currently active.
   */
  isActive: boolean;
  /**
   * A function that will be called when the user closes the modal.
   */
  onClose?: React.ReactEventHandler;
}

/**
 * Render an aria compliant modal overlay.
 */
export default class Modal extends React.Component<InjectedIntlProps & ModalProps> {
  static propTypes = {
    children: PropTypes.node,
    intl: intlShape.isRequired,
    isActive: PropTypes.bool.isRequired,
    onClose: PropTypes.func,
  };

  static defaultProps: Partial<ModalProps> = {
    children: null,
    onClose() {},
  };

  onKeyDown: React.KeyboardEventHandler = event => {
    const { onClose } = this.props;

    if (event.key === 'Escape') {
      onClose(event);
    }
  };

  render(): JSX.Element {
    const { children, intl, isActive, onClose } = this.props;

    return (
      <CSSTransition
        classNames={{
          enter: styles.enter,
          enterActive: styles.enterActive,
          exit: styles.exit,
          exitActive: styles.exitActive,
        }}
        in={isActive}
        mountOnEnter
        timeout={90}
        unmountOnExit
      >
        <div className="is-active modal">
          <div
            className="modal-background"
            onClick={onClose}
            onKeyDown={this.onKeyDown}
            role="presentation"
          />
          <div className="modal-content">{children}</div>
          <button
            aria-label={intl.formatMessage(messages.closeDialog)}
            className="modal-close is-large"
            onClick={onClose}
            type="button"
          />
        </div>
      </CSSTransition>
    );
  }
}
