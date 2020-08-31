import classNames from 'classnames';
import React, {
  ComponentPropsWithoutRef,
  ElementType,
  EventHandler,
  ReactElement,
  ReactNode,
  SyntheticEvent,
  useCallback,
} from 'react';
import { useIntl } from 'react-intl';
import { CSSTransition } from 'react-transition-group';

import styles from './index.css';
import { messages } from './messages';

interface ModalProps<T extends ElementType> {
  /**
   * The child elements to render on the modal.
   */
  children?: ReactNode;

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
  onClose?: EventHandler<SyntheticEvent>;

  /**
   * The title that is displayed at the top of the modal.
   */
  title?: ReactNode;

  /**
   * The CSS class applied to the card
   */
  cardClassName?: string;

  /**
   * The CSS class applied to the body
   */
  className?: string;

  footer?: ReactNode;
}

/**
 * Render an aria compliant modal overlay.
 */
export function Modal<T extends ElementType = 'div'>({
  cardClassName,
  children = null,
  className,
  closable = true,
  component: Component = 'div' as T,
  footer = null,
  isActive,
  onClose = () => {},
  title,
  ...props
}: ModalProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof ModalProps<T>>): ReactElement {
  const { formatMessage } = useIntl();

  const onKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        onClose(event);
      }
    },
    [onClose],
  );

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
          onKeyDown={closable ? onKeyDown : null}
          role="presentation"
        />
        {/* @ts-expect-error */}
        <Component className={classNames('modal-card', cardClassName)} {...props}>
          <div className="modal-card-head">
            <p className="modal-card-title">{title}</p>
            {closable && (
              <button
                aria-label={formatMessage(messages.closeDialog)}
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
