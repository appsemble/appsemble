import { resolveIcon } from '@appsemble/web-utils';
import classNames from 'classnames';
import { type ComponentPropsWithoutRef, type ReactNode } from 'react';

import styles from './index.module.css';
import { Icon } from '../Icon/index.js';
import { useIconContext } from '../IconProvider/index.js';

interface NavbarBurgerProps extends Omit<ComponentPropsWithoutRef<'button'>, 'children' | 'type'> {
  /**
   * Whether the menu toggled by the burger is open.
   */
  readonly active: boolean;
}

/**
 * A Bulma navbar burger that toggles a menu.
 *
 * It represents the `bars` icon while the menu is closed and `xmark` while it is open. If the app's
 * icon registry overrides that icon, the burger renders the override. Otherwise it draws Bulma’s
 * animated burger lines.
 */
export function NavbarBurger({ active, className, ...props }: NavbarBurgerProps): ReactNode {
  const { getAssetUrl, registry } = useIconContext();
  const icon = active ? 'xmark' : 'bars';
  const overridden = resolveIcon(icon, registry, getAssetUrl).type !== 'fontawesome';

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
