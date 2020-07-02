import classNames from 'classnames';
import { ComponentChildren, h, VNode } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';

import type { ElementType, Props } from '../types';
import styles from './index.css';

interface ModalProps<T extends ElementType> {
  /**
   * The child elements to render on the modal.
   */
  children?: ComponentChildren;

  /**
   * Whether the user is allowed to click on the close button or outside of the modal to close it.
   */
  closable?: boolean;

  /**
   * The aria label to apply on the close button.
   */
  closeButtonLabel?: string;

  /**
   * The Preact component to render as the root for the modal.
   */
  component?: T;

  /**
   * Wether or not the modal is currently active.
   */
  isActive: boolean;

  /**
   * A function that will be called when the user closes the modal.
   */
  onClose?: (event: Event) => void;

  /**
   * The title that is displayed at the top of the modal.
   */
  title?: VNode;

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
  footer?: VNode;
}

/**
 * Render an aria compliant modal overlay.
 */
export default function Modal<T extends ElementType = 'div'>({
  cardClassName,
  children = null,
  className,
  closable = true,
  closeButtonLabel,
  component: Component = 'div' as T,
  footer = null,
  isActive,
  onClose = () => {},
  title,
  ...props
}: ModalProps<T> & Omit<Props<T>, keyof ModalProps<T>>): VNode {
  const [open, setOpen] = useState(isActive);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose(event);
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (isActive) {
      setOpen(true);
      return undefined;
    }

    // The timeout must match the CSS transition length.
    const timeout = setTimeout(setOpen, 300, false);
    return () => clearTimeout(timeout);
  }, [isActive]);

  if (!isActive && !open) {
    return null;
  }

  return (
    <div
      className={classNames(`is-active modal ${styles.root}`, {
        [styles.opening]: isActive && !open,
        [styles.open]: isActive && open,
        [styles.closing]: !isActive && open,
      })}
    >
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
              aria-label={closeButtonLabel}
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
  );
}
