import { type IconName } from '@fortawesome/fontawesome-common-types';
import { useContext, type ReactElement, type ReactNode, useCallback } from 'react';

import styles from './index.module.css';
import { CollapsedContext, Icon, NavLink } from '../index.js';

interface SideNavLinkProps {
  /**
   * The title text to apply to the link.
   */
  title?: string;

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
export function MenuItem({ children, exact, icon, title, to }: SideNavLinkProps): ReactElement {
  const { collapsed, setCollapsed } = useContext(CollapsedContext);
  const clickHideButton = useCallback(() => {
    setCollapsed(!collapsed);
  }, [collapsed, setCollapsed]);

  return (
    <NavLink
      className={`is-flex is-align-items-center ${styles.root}`}
      exact={exact}
      title={title}
      to={to}
    >
      {icon ? <Icon className={`mr-1 ${styles.middle}`} icon={icon} size="medium" /> : null}
      <span className={styles.text}>{children}</span>
      <Icon
        className={styles.icon}
        icon={collapsed ? 'chevron-up' : 'chevron-down'}
        onClick={clickHideButton}
        size="medium"
      />
    </NavLink>
  );
}
