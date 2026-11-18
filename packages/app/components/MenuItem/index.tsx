import { type IconReference } from '@appsemble/lang-sdk';
import classNames from 'classnames';
import { Icon } from '@appsemble/preact-components';
import { type ComponentChildren, type JSX, type VNode } from 'preact';
import { useCallback, useContext } from 'preact/hooks';
import { Link } from 'wouter-preact';

import styles from './index.module.css';
import { CollapsedContext } from '../CollapsibleMenuSection/index.js';
import { NavLink } from '../NavLink/index.js';

interface SideNavLinkProps {
  /**
   * Explicit navigation selection, including an ancestor section.
   */
  readonly 'aria-current'?: 'page' | 'location' | false;

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
  readonly children?: ComponentChildren;

  /**
   * The icon to render.
   */
  readonly icon?: IconReference;

  /**
   * Where to navigate to.
   */
  readonly to?: string;

  /**
   * Count to be shown next to the item.
   */
  readonly count?: number;
}

/**
 * Render a Bulma menu item styled navigation link.
 *
 * https://bulma.io/documentation/components/menu
 */
export function MenuItem({
  'aria-current': current,
  children,
  count,
  end,
  icon,
  title,
  to,
}: SideNavLinkProps): VNode {
  const { collapsed, collapsible, setCollapsed } = useContext(CollapsedContext);
  const clickHideButton = useCallback(
    (event: JSX.TargetedMouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setCollapsed?.(!collapsed);
    },
    [collapsed, setCollapsed],
  );

  const renderMenuItem = useCallback(
    (isActive?: boolean): VNode => (
      <>
        {icon ? <Icon className={`mr-1 ${styles.middle}`} icon={icon} size="medium" /> : null}
        <span className={styles.text}>{children}</span>
        {count ? (
          <sub className={`tag is-rounded ml-1 ${isActive ? '' : 'is-dark'}`}>{count}</sub>
        ) : null}
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
    [children, clickHideButton, collapsed, collapsible, count, icon],
  );

  if (to && current !== undefined) {
    return (
      <Link
        aria-current={current}
        className={classNames(
          'is-relative is-flex is-align-items-center is-radiusless',
          styles.root,
          current && ['is-active', styles.active],
        )}
        title={title}
        to={to}
      >
        {renderMenuItem(Boolean(current))}
      </Link>
    );
  }

  return to ? (
    <NavLink
      className={(isActive) =>
        classNames(
          `is-relative is-flex is-align-items-center is-radiusless ${styles.root}`,
          isActive && 'is-active',
        )
      }
      end={end}
      title={title}
      to={to}
    >
      {renderMenuItem}
    </NavLink>
  ) : (
    <div
      aria-current={current}
      className={classNames(
        'is-relative is-flex is-radiusless px-2 py-3 ml-1',
        current && ['is-active', styles.active],
      )}
      title={title}
    >
      {renderMenuItem(Boolean(current))}
    </div>
  );
}
