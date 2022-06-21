import { ComponentPropsWithoutRef, MouseEventHandler, ReactElement } from 'react';

import { ButtonChildren, NavLink } from '..';
import styles from './index.module.css';

type NavbarItemProps = ComponentPropsWithoutRef<typeof ButtonChildren> &
  Partial<ComponentPropsWithoutRef<typeof NavLink>> & {
    /**
     * The click event handler.
     */
    onClick?: MouseEventHandler<HTMLButtonElement>;
  };

/**
 * Redner a Bulma styled navbar item.
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
