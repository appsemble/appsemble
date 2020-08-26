import { Icon } from '@appsemble/react-components';
import type { IconName } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import React, { Children, ReactElement, ReactNode } from 'react';

import { NavLink } from '../NavLink';
import { useSideMenu } from '../SideMenu';

interface SideNavLinkProps {
  /**
   * If true, only highligh on an exact match.
   */
  exact?: boolean;

  /**
   * Child navigation items to render.
   *
   * These should be `<NavLink />` elements.
   */
  children?: ReactNode;

  /**
   * The icon to render.
   */
  icon: IconName;

  /**
   * The label to render.
   */
  label: ReactNode;

  /**
   * Where to navigate to.
   */
  to: string;
}

/**
 * Render a side menu navigation item.
 *
 * This should be rendered as a child node of {@link SideMenu}.
 */
export function SideNavLink({ children, exact, icon, label, to }: SideNavLinkProps): ReactElement {
  const isCollapsed = useSideMenu();

  return (
    <>
      <NavLink exact={exact} to={to}>
        <Icon icon={icon} size="medium" />
        <span className={classNames({ 'is-hidden': isCollapsed })}>{label}</span>
      </NavLink>
      {!isCollapsed && Children.count(children) ? (
        <ul>
          {/* eslint-disable-next-line unicorn/no-fn-reference-in-iterator */}
          {Children.map(children, (child) => (
            <li>{child}</li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
