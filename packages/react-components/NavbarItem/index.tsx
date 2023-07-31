import { type ComponentPropsWithoutRef, type MouseEventHandler, type ReactElement } from 'react';

import styles from './index.module.css';
import { ButtonChildren, NavLink } from '../index.js';

type NavbarItemProps = ComponentPropsWithoutRef<typeof ButtonChildren> &
  Partial<ComponentPropsWithoutRef<typeof NavLink>> & {
    /**
     * The click event handler.
     */
    readonly onClick?: MouseEventHandler<HTMLButtonElement>;
  };

/**
 * Render a Bulma styled navbar item.
 *
 * If `onClick` is specified, a `<button />` is rendered. Otherwise a `<NavLink />` is rendered.
 */
export function NavbarItem({
  children,
  icon,
  iconPosition,
  onClick,
  to,
  ...props
}: NavbarItemProps): ReactElement {
  const content = (
    <ButtonChildren icon={icon} iconPosition={iconPosition}>
      {children}
    </ButtonChildren>
  );

  return onClick ? (
    <button
      className={`navbar-item has-background-white has-text-black-ter ${styles.button}`}
      onClick={onClick}
      type="button"
    >
      {content}
    </button>
  ) : (
    <NavLink className="navbar-item" {...props} to={to}>
      {content}
    </NavLink>
  );
}
