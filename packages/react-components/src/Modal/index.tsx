import classNames from 'classnames';
import * as React from 'react';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import { CSSTransition } from 'react-transition-group';

import styles from './index.css';
import messages from './messages';

interface ModalProps<T extends React.ElementType> extends WrappedComponentProps {
  /**
   * The child elements to render on the modal.
   */
  children?: React.ReactNode;

  /**
   * Whether the user is allowed to click on the close button or outside of the modal to close it.
   */
  closable?: boolean;

  component?: T;

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
   * The CSS class applied to the card
   */
  cardClassName?: string;

  /**
   * The CSS class applied to the body
   */
  className?: string;

  footer?: React.ReactNode;
}

/**
 * Render an aria compliant modal overlay.
 */
class Modal<T extends React.ElementType = 'div'> extends React.Component<
  ModalProps<T> & React.ComponentPropsWithoutRef<T>
> {
  static defaultProps: Partial<ModalProps<'div'>> = {
    component: 'div',
    children: null,
    footer: null,
    onClose() {},
  };

  onKeyDown: React.KeyboardEventHandler = event => {
    const { onClose } = this.props;

    if (event.key === 'Escape') {
      onClose(event);
    }
  };

  render(): React.ReactElement {
    const {
      cardClassName,
      children,
      className,
      closable = true,
      component: Component,
      footer,
      intl,
      isActive,
      onClose,
      title,
      ...props
    } = this.props;

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
            onClick={closable ? onClose : null}
            onKeyDown={closable ? this.onKeyDown : null}
            role="presentation"
          />
          <Component className={classNames('modal-card', cardClassName)} {...props}>
            <div className="modal-card-head">
              <p className="modal-card-title">{title}</p>
              {closable && (
                <button
                  aria-label={intl.formatMessage(messages.closeDialog)}
                  className="delete is-large"
                  onClick={onClose}
                  type="button"
                />
              )}
            </div>
            <div className={classNames('modal-card-body', className)}>{children}</div>
            {footer && <footer className="card-footer">{footer}</footer>}
          </Component>
        </div>
      </CSSTransition>
    );
  }
}

export default injectIntl(Modal);
