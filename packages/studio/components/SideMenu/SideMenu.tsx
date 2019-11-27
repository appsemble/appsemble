import { Icon } from '@appsemble/react-components';
import classNames from 'classnames';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import styles from './SideMenu.css';

export interface SideMenuProps {
  children: React.ReactChild[];
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

export default function SideMenu({
  children = [],
  isCollapsed,
  toggleCollapse,
}: SideMenuProps): JSX.Element {
  return (
    <div className={classNames({ [styles.collapsed]: isCollapsed }, styles.sideMenuContainer)}>
      <aside className={classNames('menu', styles.sideMenu)}>
        <ul className="menu-list">
          {React.Children.map(children, (item, index) => {
            // eslint-disable-next-line react/no-array-index-key
            return <li key={index}>{item}</li>;
          })}
        </ul>
        <button
          className={`button ${styles.collapseButton}`}
          onClick={toggleCollapse}
          type="button"
        >
          <Icon icon={isCollapsed ? 'angle-double-right' : 'angle-double-left'} size="medium" />
          <span className={classNames({ 'is-hidden': isCollapsed })}>
            <FormattedMessage {...messages.collapse} />
          </span>
        </button>
      </aside>
    </div>
  );
}
