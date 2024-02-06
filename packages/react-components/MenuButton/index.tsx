import { type BulmaColor } from '@appsemble/types';
import { type IconName } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import { type MouseEventHandler, type ReactNode } from 'react';

import styles from './index.module.css';
import { Icon } from '../index.js';

interface MenuButtonItemProps {
  /**
   * The title text to apply to the button.
   */
  readonly title?: string;

  /**
   * Child navigation items to render.
   */
  readonly children?: ReactNode;

  /**
   * Whether or not this menu item is a child.
   */
  readonly isChild?: boolean;

  /**
   * The icon to render.
   */
  readonly icon?: IconName;

  /**
   * The color for the icon.
   */
  readonly iconColor?: BulmaColor;

  /**
   * Click handler for the menu item.
   */
  readonly onClick: MouseEventHandler<HTMLButtonElement>;

  /**
   * Whether the menu item should be active.
   */
  readonly active: boolean;
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
}: MenuButtonItemProps): ReactNode {
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
