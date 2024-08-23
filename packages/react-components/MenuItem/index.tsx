import { type IconName } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import { type MouseEvent, type ReactNode, useCallback, useContext } from 'react';

import styles from './index.module.css';
import { CollapsedContext, Icon, NavLink } from '../index.js';

interface SideNavLinkProps {
  /**
   * The title text to apply to the link.
   */
  readonly title?: string;

  /**
   * If true, only highlight if end is an exact match.
   */
  readonly end?: boolean;

  /**
   * Child navigation items to render.
   */
  readonly children?: ReactNode;

  /**
   * The icon to render.
   */
  readonly icon?: IconName;

  /**
   * Where to navigate to.
   */
  readonly to?: string;
}

/**
 * Render a Bulma menu item styled navigation link.
 *
 * https://bulma.io/documentation/components/menu
 */
export function MenuItem({ children, end, icon, title, to }: SideNavLinkProps): ReactNode {
  const { collapsed, collapsible, setCollapsed } = useContext(CollapsedContext);
  const clickHideButton = useCallback(
    (event: MouseEvent<HTMLSpanElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setCollapsed(!collapsed);
    },
    [collapsed, setCollapsed],
  );

  const renderMenuItem = useCallback(
    (isActive?: boolean): ReactNode => (
      <>
        {icon ? <Icon className={`mr-1 ${styles.middle}`} icon={icon} size="medium" /> : null}
        <span className={styles.text}>{children}</span>
        {collapsible ? (
          <Icon
            className={styles.icon}
            color={isActive ? 'white' : 'dark'}
            icon={collapsed ? 'chevron-up' : 'chevron-down'}
            onClick={clickHideButton}
            size="medium"
          />
        ) : null}
      </>
    ),
    [children, clickHideButton, collapsed, collapsible, icon],
  );

  return to ? (
    <NavLink
      className={classNames(`is-relative is-flex is-align-items-center ${styles.root}`)}
      end={end}
      title={title}
      to={to}
    >
      {({ isActive }) => renderMenuItem(isActive)}
    </NavLink>
  ) : (
    <div className={classNames('is-relative is-flex px-2 py-3 ml-1')}>{renderMenuItem()}</div>
  );
}
