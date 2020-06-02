import { Icon } from '@appsemble/react-components/src';
import type { IconName } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import * as React from 'react';

import NavLink from '../NavLink';
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
  children?: React.ReactNode;

  /**
   * The icon to render.
   */
  icon: IconName;

  /**
   * The label to render.
   */
  label: React.ReactNode;

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
export default function SideNavLink({
  children,
  exact,
  icon,
  label,
  to,
}: SideNavLinkProps): React.ReactElement {
  const isCollapsed = useSideMenu();

  return (
    <>
      <NavLink exact={exact} to={to}>
        <Icon icon={icon} size="medium" />
        <span className={classNames({ 'is-hidden': isCollapsed })}>{label}</span>
      </NavLink>
      {!isCollapsed && React.Children.count(children) ? (
        <ul>
          {React.Children.map(children, (child) => (
            <li>{child}</li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
