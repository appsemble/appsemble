import classNames from 'classnames';
import {
  type ComponentPropsWithoutRef,
  type ElementType,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { useIntl } from 'react-intl';

import styles from './index.module.css';
import { useAnimation } from '../index.js';
import { ModalDialogContext, useModalDialog } from '../useModalDialog/index.js';
import { messages } from '../useModalDialog/messages.js';

interface ModalProps<T extends ElementType> {
  /**
   * The child elements to render on the modal.
   */
  readonly children?: ReactNode;

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
   * The React component to render as the root for the modal.
   */
  readonly component?: T;

  /**
   * Extra class name parameter to apply to the root of the component.
   */
  readonly extraClassName?: string;

  /**
   * Wether or not the modal is currently active.
   */
  readonly isActive: boolean;

  /**
   * A function that will be called when the user closes the modal.
   */
  readonly onClose?: (event: KeyboardEvent | MouseEvent) => void;

  /**
   * The title that is displayed at the top of the modal.
   */
  readonly title?: ReactNode;

  /**
   * The CSS class applied to the card.
   */
  readonly cardClassName?: string;

  /**
   * The CSS class applied to the body.
   */
  readonly className?: string;

  /**
   * The footer to render on the modal.
   */
  readonly footer?: ReactNode;
}

/**
 * Render an aria compliant modal overlay.
 */
export function Modal<T extends ElementType = 'div'>({
  children = null,
  className,
  closable = true,
  closeButtonLabel,
  component: Component = 'div' as T,
  extraClassName,
  isActive,
  onClose,
  ...props
}: ModalProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof ModalProps<T>>): ReactNode {
  const openClass = useAnimation(isActive, 300, {
    opening: styles.opening,
    open: styles.open,
    closing: styles.closing,
  });

  const { formatMessage } = useIntl();
  const { onKeyDown, ref } = useModalDialog({ closable, isActive, onClose });

  if (!openClass) {
    return null;
  }

  return (
    <ModalDialogContext.Provider value>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/prefer-tag-over-role */}
      <div
        aria-modal="true"
        className={`is-active modal ${styles.root} ${extraClassName} ${openClass}`}
        onKeyDown={onKeyDown}
        ref={ref}
        role="dialog"
        tabIndex={-1}
      >
        {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
        <div
          className="modal-background"
          onClick={closable ? onClose : undefined}
          role="presentation"
        />
        {/* @ts-expect-error This construct should work */}
        <Component className={classNames('modal-content', className)} {...props}>
          {children}
        </Component>
        {closable ? (
          <button
            aria-label={closeButtonLabel ?? formatMessage(messages.close)}
            className="modal-close is-large"
            onClick={onClose}
            type="button"
          />
        ) : null}
      </div>
    </ModalDialogContext.Provider>
  );
}
