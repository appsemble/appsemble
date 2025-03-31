import { type ComponentPropsWithoutRef, type MouseEventHandler, type ReactNode } from 'react';

import styles from './index.module.css';
import { ButtonChildren, NavLink } from '../index.js';

type NavbarItemProps = ComponentPropsWithoutRef<typeof ButtonChildren> &
  Partial<ComponentPropsWithoutRef<typeof NavLink>> & {
    /**
     * The click event handler.
     */
    readonly onClick?: MouseEventHandler<HTMLButtonElement>;

    readonly dataTestId?: string;
  };

/**
 * Render a Bulma styled navbar item.
 *
 * If `onClick` is specified, a `<button />` is rendered. Otherwise a `<NavLink />` is rendered.
 */
export function NavbarItem({
  children,
  dataTestId = '',
  icon,
  iconPosition,
  onClick,
  to,
  ...props
}: NavbarItemProps): ReactNode {
  const content = (
    <ButtonChildren icon={icon} iconPosition={iconPosition}>
      {children}
    </ButtonChildren>
  );

  return onClick ? (
    <button
      className={`navbar-item has-background-white has-text-black-ter ${styles.button}`}
      data-testid={dataTestId}
      onClick={onClick}
      type="button"
    >
      {content}
    </button>
  ) : (
    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
    // @ts-ignore 2322 null is not assignable to type (strictNullChecks)
    <NavLink className="navbar-item" {...props} to={to}>
      {content}
    </NavLink>
  );
}
