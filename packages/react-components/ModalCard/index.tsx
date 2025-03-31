import classNames from 'classnames';
import {
  type ComponentPropsWithoutRef,
  type ElementType,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useCallback,
} from 'react';

import styles from './index.module.css';
import { useAnimation } from '../index.js';

interface ModalCardProps<T extends ElementType> {
  /**
   * The child elements to render on the modal.
   */
  readonly children?: ReactNode;

  /**
   * Whether the user is allowed to click on the close button or outside of the modal to close it.
   */
  readonly closable?: boolean;

  /**
   * The aria label to apply on the close button.
   */
  readonly closeButtonLabel?: string;

  /**
   * The React component to render as the root for the modal.
   */
  readonly component?: T;

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
   * The CSS class applied to the card.
   */
  readonly wrapperClassName?: string;

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
  wrapperClassName,
  ...props
}: ModalCardProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof ModalCardProps<T>>): ReactNode {
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
    <div className={classNames(`is-active modal ${styles.root} ${openClass}`, wrapperClassName)}>
      {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
      <div
        className="modal-background"
        onClick={closable ? onClose : undefined}
        onKeyDown={closable ? onKeyDown : undefined}
        role="presentation"
      />
      {/* @ts-expect-error This should be fine */}
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
        <div className={classNames('modal-card-foot', 'p-0', styles.footer)}>
          {footer || <div className={styles['footer-placeholder']} />}
        </div>
      </Component>
    </div>
  );
}
