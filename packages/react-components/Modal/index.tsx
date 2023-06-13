import classNames from 'classnames';
import {
  type ComponentPropsWithoutRef,
  type ElementType,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  useCallback,
} from 'react';

import styles from './index.module.css';
import { useAnimation } from '../index.js';

interface ModalProps<T extends ElementType> {
  /**
   * The child elements to render on the modal.
   */
  children?: ReactNode;

  /**
   * Whether the user is allowed to click on the close button or outside of the modal to close it.
   */
  closable?: boolean;

  /**
   * The aria label to apply on the close button.
   */
  closeButtonLabel?: string;

  /**
   * The React component to render as the root for the modal.
   */
  component?: T;

  /**
   * Wether or not the modal is currently active.
   */
  isActive: boolean;

  /**
   * A function that will be called when the user closes the modal.
   */
  onClose?: (event: KeyboardEvent | MouseEvent) => void;

  /**
   * The title that is displayed at the top of the modal.
   */
  title?: ReactNode;

  /**
   * The CSS class applied to the card.
   */
  cardClassName?: string;

  /**
   * The CSS class applied to the body.
   */
  className?: string;

  /**
   * The footer to render on the modal.
   */
  footer?: ReactNode;
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
  isActive,
  onClose,
  ...props
}: ModalProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof ModalProps<T>>): ReactElement {
  const openClass = useAnimation(isActive, 300, {
    opening: styles.opening,
    open: styles.open,
    closing: styles.closing,
  });

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.(event);
      }
    },
    [onClose],
  );

  if (!openClass) {
    return null;
  }

  return (
    <div className={`is-active modal ${styles.root} ${openClass}`}>
      {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
      <div
        className="modal-background"
        onClick={closable ? onClose : null}
        onKeyDown={closable ? onKeyDown : null}
        role="presentation"
      />
      {/* @ts-expect-error This construct should work */}
      <Component className={classNames('modal-content', className)} {...props}>
        {children}
      </Component>
      {closable ? (
        <button
          aria-label={closeButtonLabel}
          className="modal-close is-large"
          onClick={onClose}
          type="button"
        />
      ) : null}
    </div>
  );
}
