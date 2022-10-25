import { ReactElement } from 'react';
import { useIntl } from 'react-intl';

import { Sidebar } from '../Components/Sidebar/index.js';
import { GuiEditorTabs } from '../index.js';
<<<<<<< HEAD
import styles from './index.module.css';
=======
>>>>>>> 58d2017e1 (Remove unused files)

interface ResourcesTabProps {
  tab: GuiEditorTabs;
  isOpenLeft: boolean;
  isOpenRight: boolean;
}
export function ResourcesTab({ isOpenLeft, isOpenRight, tab }: ResourcesTabProps): ReactElement {
  const { formatMessage } = useIntl();
  return (
    <>
      <Sidebar isOpen={isOpenLeft} type="left">
        <span className="text-2xl font-bold">{formatMessage(tab.title)}</span>
      </Sidebar>
<<<<<<< HEAD
      <div className={styles.root}>{formatMessage(tab.title)}</div>
=======
      <div>{tab.title}</div>
>>>>>>> 58d2017e1 (Remove unused files)
      <Sidebar isOpen={isOpenRight} type="right">
        <span className="text-2xl font-bold">{formatMessage(tab.title)}</span>
      </Sidebar>
    </>
  );
}
