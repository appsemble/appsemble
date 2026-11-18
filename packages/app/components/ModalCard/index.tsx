import { useAnimation } from '@appsemble/preact-components';
import classNames from 'classnames';
import {
  type ComponentChildren,
  type ComponentProps,
  type ComponentType,
  type JSX,
  type VNode,
} from 'preact';
import { useCallback, useId, useRef } from 'preact/hooks';

import styles from './index.module.css';
import { messages } from './messages.js';
import { ModalDialogContext, useModalDialog } from './useModalDialog.js';
import { useIntl } from '../IntlProvider/index.js';

type ModalCardComponent = ComponentType<any> | keyof JSX.IntrinsicElements;

interface ModalCardProps<T extends ModalCardComponent> {
  /**
   * The child elements to render on the modal.
   */
  readonly children?: ComponentChildren;

  /**
   * Whether the user is allowed to close the modal using the close button, by clicking outside of
   * it, or by pressing escape.
   */
  readonly closable?: boolean;

  /**
   * The aria label to apply on the close button. Defaults to a translated "Close".
   */
  readonly closeButtonLabel?: string;

  /**
   * The component to render as the root for the modal.
   */
  readonly component?: T;

  /**
   * Wether or not the modal is currently active.
   */
  readonly isActive: boolean;

  /**
   * A function that will be called when the user closes the modal.
   */
  readonly onClose?: (event: Event) => void;

  /**
   * The title that is displayed at the top of the modal.
   */
  readonly title?: ComponentChildren;

  /**
   * The CSS class applied to the card.
   */
  readonly cardClassName?: string;

  /**
   * The CSS class applied to the dialog wrapping the card.
   */
  readonly wrapperClassName?: string;

  /**
   * The CSS class applied to the body.
   */
  readonly className?: string;

  /**
   * The footer to render on the modal.
   */
  readonly footer?: ComponentChildren;
}

/**
 * Render an aria compliant modal overlay.
 */
export function ModalCard<T extends ModalCardComponent = 'div'>({
  cardClassName,
  children = null,
  className,
  closable = true,
  closeButtonLabel,
  component: Component = 'div' as T,
  footer = null,
  isActive,
  onClose,
  title,
  wrapperClassName,
  ...props
}: ModalCardProps<T> & Omit<ComponentProps<T>, keyof ModalCardProps<T>>): VNode | null {
  const openClass = useAnimation(isActive, 300, {
    opening: styles.opening,
    open: styles.open,
    closing: styles.closing,
  });

  const { formatMessage } = useIntl();
  const titleId = useId();
  const dialogProps = useModalDialog({ closable, isActive, onClose });
  const backgroundRef = useRef<HTMLDivElement>(null);

  const onClick = useCallback(
    (event: MouseEvent) => {
      if (closable && event.target === backgroundRef.current) {
        onClose?.(event);
      }
    },
    [closable, onClose],
  );

  if (!openClass) {
    return null;
  }

  // The component is either an intrinsic element or a component accepting the remaining props.
  const Root = Component as ComponentType<any>;

  return (
    <ModalDialogContext.Provider value>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <dialog
        aria-labelledby={title ? titleId : undefined}
        className={classNames(
          `is-active modal ${styles.root} ${openClass}`,
          dialogProps.className,
          wrapperClassName,
        )}
        onCancel={dialogProps.onCancel}
        onClick={onClick}
        onClose={dialogProps.onClose}
        onKeyDown={dialogProps.onKeyDown}
        open
        ref={dialogProps.ref}
        tabIndex={-1}
      >
        <div className="modal-background" ref={backgroundRef} />
        <Root className={classNames('modal-card', cardClassName)} {...props}>
          {title || closable ? (
            <div className="modal-card-head">
              {title ? (
                <h2 className="modal-card-title" id={titleId}>
                  {title}
                </h2>
              ) : null}
              {closable ? (
                <button
                  aria-label={closeButtonLabel ?? formatMessage(messages.close)}
                  className="delete is-large ml-auto"
                  onClick={onClose}
                  type="button"
                />
              ) : null}
            </div>
          ) : null}
          <div className={classNames('modal-card-body', styles.body, className)}>{children}</div>
          <div className={classNames('modal-card-foot', 'p-0', styles.footer)}>
            {footer || <div className={styles['footer-placeholder']} />}
          </div>
        </Root>
      </dialog>
    </ModalDialogContext.Provider>
  );
}
