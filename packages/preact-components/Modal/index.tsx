import classNames from 'classnames';
import { type ComponentChildren, type ComponentProps, type VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import styles from './index.module.css';
import { type ElementType, useAnimation } from '../index.js';

interface ModalProps<T extends ElementType> {
  /**
   * The child elements to render on the modal.
   */
  readonly children?: ComponentChildren;

  /**
   * Whether the user is allowed to click on the close button or outside of the modal to close it.
   */
  readonly closable?: boolean;

  /**
   * The aria label to apply on the close button.
   */
  readonly closeButtonLabel?: string;

  /**
   * The Preact component to render as the root for the modal.
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
   * The CSS class applied to the body.
   */
  readonly className?: string;
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
}: ModalProps<T> & Omit<ComponentProps<T>, keyof ModalProps<T>>): VNode {
  const openClass = useAnimation(isActive, 300, {
    opening: styles.opening,
    open: styles.open,
    closing: styles.closing,
  });

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      event.stopPropagation();
      if (closable && event.key === 'Escape') {
        onClose?.(event);
      }
    },
    [closable, onClose],
  );

  const handleClose = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      if (closable) {
        onClose?.(e);
      }
    },
    [closable, onClose],
  );

  if (!openClass) {
    return null;
  }

  return (
    <div className={`is-active modal ${styles.root} ${openClass}`}>
      {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
      <div
        className="modal-background"
        onClick={handleClose}
        onKeyDown={handleKeyDown}
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
          onClick={handleClose}
          type="button"
        />
      ) : null}
    </div>
  );
}
