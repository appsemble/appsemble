import { type BulmaColor } from '@appsemble/types';
import { type IconName } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import { type MouseEventHandler, type ReactElement, type ReactNode } from 'react';

import styles from './index.module.css';
import { Icon } from '../index.js';

interface MenuButtonItemProps {
  /**
   * The title text to apply to the button.
   */
  title?: string;

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
  onClick: MouseEventHandler<HTMLButtonElement>;

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
  title,
}: MenuButtonItemProps): ReactElement {
  return (
    <button
      className={classNames(`is-flex is-align-items-center ${styles.root}`, {
        'is-active': active,
        'pl-2': !isChild,
      })}
      onClick={onClick}
      title={title}
      type="button"
    >
      {icon ? <Icon className="mr-1" color={iconColor} icon={icon} size="medium" /> : null}
      <span className={styles.text}>{children}</span>
    </button>
  );
}
