import classNames from 'classnames';
import { type ComponentChildren, type ComponentProps, type VNode } from 'preact';
import { useCallback, useId, useRef } from 'preact/hooks';

import styles from './index.module.css';
import { type ElementType, useAnimation } from '../index.js';
import { useModalDialog } from '../useModalDialog/index.js';

interface ModalCardProps<T extends ElementType> {
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
   * The title that is displayed at the top of the modal.
   */
  readonly title?: VNode;

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
  readonly footer?: VNode;

  /**
   * Whether to render on full screen.
   */
  readonly fullscreen?: boolean;
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
  // @ts-expect-error strictNullChecks not assignable to type
  footer = null,
  fullscreen,
  isActive,
  onClose,
  title,
  ...props
}: ModalCardProps<T> & Omit<ComponentProps<T>, keyof ModalCardProps<T>>): VNode | null {
  const openClass = useAnimation(isActive, 300, {
    opening: styles.opening,
    open: styles.open,
    closing: styles.closing,
  });

  const titleId = useId();
  const dialogProps = useModalDialog({ closable, isActive, onClose });
  const backgroundRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(
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

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <dialog
      aria-labelledby={title ? titleId : undefined}
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
      <Component
        className={classNames('modal-card', cardClassName, { [styles.fullscreen]: fullscreen })}
        {...props}
      >
        <div className="modal-card-head">
          <p className="modal-card-title" id={titleId}>
            {title}
          </p>
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
        <div className={classNames('modal-card-foot', 'p-0', styles.footer)}>
          {footer || <div className={styles['footer-placeholder']} />}
        </div>
      </Component>
      <slot name={dialogProps.slot} />
    </dialog>
  );
}
