import { ReactElement } from 'react';

import { Sidebar } from '../Components/Sidebar/index.js';
import { GuiEditorTabs } from '../index.js';
import styles from '../PagesTab/index.module.css';

interface ResourcesTabProps {
  tab: GuiEditorTabs;
  isOpenLeft: boolean;
  isOpenRight: boolean;
}
export function ResourcesTab({ isOpenLeft, isOpenRight, tab }: ResourcesTabProps): ReactElement {
  return (
    <>
      <Sidebar isOpen={isOpenLeft} type="left">
        <span className="text-2xl font-bold">{tab.title}</span>
      </Sidebar>
      <div className={styles.root}>{tab.title}</div>
      <Sidebar isOpen={isOpenRight} type="right">
        <span className="text-2xl font-bold">{tab.title}</span>
      </Sidebar>
    </>
  );
}
