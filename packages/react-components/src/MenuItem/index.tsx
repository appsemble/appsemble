import { IconName } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import { ReactElement, ReactNode } from 'react';
import { BulmaColor } from 'sdk/src/types';

import { Icon, NavLink } from '..';
import styles from './index.module.css';

interface SideNavLinkProps {
  /**
   * If true, only highlight on an exact match.
   */
  exact?: boolean;

  /**
   * Child navigation items to render.
   */
  children?: ReactNode;

  /**
   * The icon to render.
   */
  icon?: IconName;

  /**
   * Where to navigate to.
   */
  to: string;
}

/**
 * Render a Bulma menu item styled navigation link.
 *
 * https://bulma.io/documentation/components/menu
 */
export function MenuItem({ children, exact, icon, to }: SideNavLinkProps): ReactElement {
  return (
    <NavLink className={`is-flex is-align-items-center ${styles.root}`} exact={exact} to={to}>
      {icon && <Icon className={`mr-1 ${styles.middle}`} icon={icon} size="medium" />}
      <span className={styles.text}>{children}</span>
    </NavLink>
  );
}

interface MenuButtonItemProps {
  /**
   * Child navigation items to render.
   */
  children?: ReactNode;

  /**
   * Whether or not this menu item is a child.
   */
  isChild?: boolean;

  /**
   * The icon to render.
   */
  icon?: IconName;

  /**
   * The color for the icon.
   */
  iconColor?: BulmaColor;

  /**
   * Where to navigate to.
   */
  onClick: () => Promise<void>;

  /**
   * Whether the menu item should be active.
   */
  active: boolean;
}

/**
 * Render a Bulma menu item styled navigation link.
 *
 * https://bulma.io/documentation/components/menu
 */
export function MenuButton({
  active,
  children,
  icon,
  iconColor,
  isChild,
  onClick,
}: MenuButtonItemProps): ReactElement {
  return (
    <button
      className={classNames(`is-flex is-align-items-center ${styles.button} ${styles.root}`, {
        'is-active': active,
        'px-2': !isChild,
      })}
      onClick={onClick}
      type="button"
    >
      {icon && (
        <Icon
          className={classNames(`mr-1 ${styles.middle}`, {
            [`has-text-${iconColor}`]: iconColor,
          })}
          icon={icon}
          size="medium"
        />
      )}
      <span className={styles.text}>{children}</span>
    </button>
  );
}
