/** @jsx h */
import { Component, h } from 'preact';
import { CSSTransition } from 'preact-transition-group';

import styles from './Modal.css';

export interface ModalProps {
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
  onClose?: (event: Event) => void;

  /**
   * The aria label for the close button
   */
  closeLabel: string;
}

/**
 * Render an aria compliant modal overlay.
 */
export default class Modal extends Component<ModalProps> {
  static defaultProps: Partial<ModalProps> = {
    children: null,
    onClose() {},
  };

  onKeyDown = (event: KeyboardEvent) => {
    const { onClose } = this.props;

    if (event.key === 'Escape') {
      onClose(event);
    }
  };

  render(): JSX.Element {
    const { children, closeLabel, isActive, onClose } = this.props;

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
          <div className="modal-content">{children}</div>
          <button
            aria-label={closeLabel}
            className="modal-close is-large"
            onClick={onClose}
            type="button"
          />
        </div>
      </CSSTransition>
    );
  }
}
