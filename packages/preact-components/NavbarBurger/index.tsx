import classNames from 'classnames';
import { type JSX, type VNode } from 'preact';

import styles from './index.module.css';
import { Icon } from '../Icon/index.js';
import { useIconContext } from '../IconProvider/index.js';

interface NavbarBurgerProps extends Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'type'
> {
  /**
   * Whether the menu toggled by the burger is open.
   */
  readonly active: boolean;

  /**
   * An additional class name to apply to the button.
   */
  readonly className?: string;
}

/**
 * A Bulma navbar burger that toggles a menu.
 *
 * It represents the `bars` icon while the menu is closed and `xmark` while it is open. If the app's
 * icon registry overrides that icon, the burger renders the override. Otherwise it draws Bulma's
 * animated burger lines.
 */
export function NavbarBurger({ active, className, ...props }: NavbarBurgerProps): VNode {
  const iconContext = useIconContext();
  const icon = active ? 'xmark' : 'bars';
  const overridden = Boolean(iconContext && iconContext.resolveIcon(icon).type !== 'fontawesome');

  return (
    <button
      className={classNames('navbar-burger', styles.burger, className, { 'is-active': active })}
      type="button"
      {...props}
    >
      {overridden ? (
        <Icon className={styles.icon} icon={icon} />
      ) : (
        <>
          <span aria-hidden />
          <span aria-hidden />
          <span aria-hidden />
        </>
      )}
    </button>
  );
}
