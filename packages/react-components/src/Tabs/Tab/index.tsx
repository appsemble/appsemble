import classNames from 'classnames';
import React from 'react';

import styles from './index.css';

export interface TabProps {
  name: string;
  activeTab: string;
  onChangeActiveTab: () => void;
}

export default function Tab({ activeTab, name, onChangeActiveTab }: TabProps): React.ReactElement {
  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <li
      className={classNames(styles.tabLabel, { [styles.isActive]: name === activeTab })}
      onClick={onChangeActiveTab}
      onKeyDown={null}
    >
      {name}
    </li>
  );
}
