import { BulmaColor } from '@appsemble/sdk';
import { IconName } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import { ReactElement, ReactNode } from 'react';

import { Icon } from '..';
import styles from './index.module.css';

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
   * Click handler for the menu item.
   */
  onClick: () => void;

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
        'pl-2': !isChild,
      })}
      onClick={onClick}
      type="button"
    >
      {icon && <Icon className="mr-1" color={iconColor} icon={icon} size="medium" />}
      <span className={styles.text}>{children}</span>
    </button>
  );
}
