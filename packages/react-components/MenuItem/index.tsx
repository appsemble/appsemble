import { type IconName } from '@fortawesome/fontawesome-common-types';
import { type ReactElement, type ReactNode, useCallback, useContext } from 'react';
import { useLocation } from 'react-router-dom';

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
  const { collapsed, collapsible, setCollapsed } = useContext(CollapsedContext);
  const location = useLocation();
  const clickHideButton = useCallback(() => {
    setCollapsed(!collapsed);
  }, [collapsed, setCollapsed]);

  return (
    <div className={styles.menuContainer}>
      <NavLink
        className={`is-flex is-align-items-center ${styles.root}`}
        exact={exact}
        title={title}
        to={to}
      >
        {icon ? <Icon className={`mr-1 ${styles.middle}`} icon={icon} size="medium" /> : null}
        <span className={styles.text}>{children}</span>
      </NavLink>
      {collapsible ? (
        <Icon
          className={styles.icon}
          color={
            location.pathname === to || (!exact && location.pathname.startsWith(`${to}/`))
              ? 'white'
              : 'dark'
          }
          icon={collapsed ? 'chevron-up' : 'chevron-down'}
          onClick={clickHideButton}
          size="medium"
        />
      ) : null}
    </div>
  );
}
