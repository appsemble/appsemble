import { ButtonChildren, type ButtonChildrenProps } from '@appsemble/preact-components';
import classNames from 'classnames';
import { type ComponentProps, type JSX, type VNode } from 'preact';

import styles from './index.module.css';
import { NavLink } from '../NavLink/index.js';

type NavbarItemProps = ButtonChildrenProps &
  Partial<ComponentProps<typeof NavLink>> & {
    /**
     * The click event handler.
     */
    readonly onClick?: JSX.MouseEventHandler<HTMLButtonElement>;

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
}: NavbarItemProps): VNode {
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
    <NavLink
      className={(isActive) => classNames('navbar-item is-radiusless', isActive && 'is-active')}
      {...props}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore 2322 null is not assignable to type (strictNullChecks)
      to={to}
    >
      {content}
    </NavLink>
  );
}
