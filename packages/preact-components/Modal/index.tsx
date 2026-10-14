import classNames from 'classnames';
import { type ComponentChildren, type ComponentProps, type VNode } from 'preact';
import { useCallback, useRef } from 'preact/hooks';

import styles from './index.module.css';
import { type ElementType, useAnimation } from '../index.js';
import { useModalDialog } from '../useModalDialog/index.js';

interface ModalProps<T extends ElementType> {
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
   * The aria label to apply on the close button.
   */
  readonly closeButtonLabel: string;

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
}: ModalProps<T> & Omit<ComponentProps<T>, keyof ModalProps<T>>): VNode | null {
  const openClass = useAnimation(isActive, 300, {
    opening: styles.opening,
    open: styles.open,
    closing: styles.closing,
  });

  const dialogProps = useModalDialog({ closable, isActive, onClose });
  const backgroundRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (event.target === backgroundRef.current) {
        event.stopPropagation();
        if (closable) {
          onClose?.(event);
        }
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
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <dialog
      className={classNames(`is-active modal ${styles.root} ${openClass}`, dialogProps.className)}
      onCancel={dialogProps.onCancel}
      onClick={handleClick}
      onClose={dialogProps.onClose}
      onKeyDown={dialogProps.onKeyDown}
      open
      ref={dialogProps.ref}
      tabIndex={-1}
    >
      <div className="modal-background" ref={backgroundRef} />
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
    </dialog>
  );
}
