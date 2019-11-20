import classNames from 'classnames';
import * as React from 'react';
import { WrappedComponentProps } from 'react-intl';
import { CSSTransition } from 'react-transition-group';

import messages from './messages';
import styles from './Modal.css';

export interface ModalProps extends WrappedComponentProps {
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

  /**
   * The title that is displayed at the top of the modal.
   */
  title?: React.ReactNode;

  /**
   * The CSS class applied to the body
   */
  className?: string;
}

/**
 * Render an aria compliant modal overlay.
 */
export default class Modal extends React.Component<ModalProps> {
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
    const { children, className, intl, isActive, onClose, title } = this.props;

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
        <div className={`is-active modal ${styles.modal}`}>
          <div
            className="modal-background"
            onClick={onClose}
            onKeyDown={this.onKeyDown}
            role="presentation"
          />
          <div className="modal-card">
            <div className="modal-card-head">
              <p className="modal-card-title">{title}</p>
              <button
                aria-label={intl.formatMessage(messages.closeDialog)}
                className="delete is-large"
                onClick={onClose}
                type="button"
              />
            </div>
            <div className={classNames('modal-card-body', className)}>{children}</div>
          </div>
        </div>
      </CSSTransition>
    );
  }
}
