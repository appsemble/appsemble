import classNames from 'classnames';
import { ComponentChildren, ComponentProps, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import { ElementType, useAnimation } from '..';
import styles from './index.module.css';

interface ModalCardProps<T extends ElementType> {
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
 * Render an aria compliant modal card overlay.
 */
export function ModalCard<T extends ElementType = 'div'>({
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
  ...props
}: ModalCardProps<T> & Omit<ComponentProps<T>, keyof ModalCardProps<T>>): VNode {
  const openClass = useAnimation(isActive, 300, {
    opening: styles.opening,
    open: styles.open,
    closing: styles.closing,
  });

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose(event);
      }
    },
    [onClose],
  );

  if (!openClass) {
    return null;
  }

  return (
    <div className={`is-active modal ${styles.root} ${openClass}`}>
      <div
        className="modal-background"
        onClick={closable ? onClose : null}
        onKeyDown={closable ? onKeyDown : null}
        role="presentation"
      />
      {/* @ts-expect-error This construct should work */}
      <Component className={classNames('modal-card', cardClassName)} {...props}>
        <div className="modal-card-head">
          <p className="modal-card-title">{title}</p>
          {closable ? (
            <button
              aria-label={closeButtonLabel}
              className="delete is-large"
              onClick={onClose}
              type="button"
            />
          ) : null}
        </div>
        <div className={classNames('modal-card-body', className)}>{children}</div>
        {footer ? <footer className="card-footer">{footer}</footer> : null}
      </Component>
    </div>
  );
}
