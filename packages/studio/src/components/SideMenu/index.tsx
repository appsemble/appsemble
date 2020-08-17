import { Button } from '@appsemble/react-components';
import classNames from 'classnames';
import React, { Children, createContext, ReactChild, ReactElement, useContext } from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './index.css';
import { messages } from './messages';

interface SideMenuProps {
  children: ReactChild[];
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

const Context = createContext<boolean>(false);

export function SideMenu({
  children = [],
  isCollapsed,
  toggleCollapse,
}: SideMenuProps): ReactElement {
  return (
    <div className={classNames({ [styles.collapsed]: isCollapsed }, styles.sideMenuContainer)}>
      <aside className={classNames('menu', styles.sideMenu)}>
        <ul className="menu-list">
          <Context.Provider value={isCollapsed}>
            {/* eslint-disable-next-line unicorn/no-fn-reference-in-iterator */}
            {Children.map(children, (item, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <li key={index}>{item}</li>
            ))}
          </Context.Provider>
        </ul>
        <Button
          className={styles.collapseButton}
          icon={isCollapsed ? 'angle-double-right' : 'angle-double-left'}
          onClick={toggleCollapse}
        >
          <span className={classNames({ 'is-hidden': isCollapsed })}>
            <FormattedMessage {...messages.collapse} />
          </span>
        </Button>
      </aside>
    </div>
  );
}

export function useSideMenu(): boolean {
  return useContext(Context);
}
