import { ReactElement } from 'react';
import { useIntl } from 'react-intl';

import { Sidebar } from '../Components/Sidebar/index.js';
import { GuiEditorTabs } from '../index.js';
import styles from './index.module.css';

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
      <div className={styles.root}>{formatMessage(tab.title)}</div>
      <Sidebar isOpen={isOpenRight} type="right">
        <span className="text-2xl font-bold">{formatMessage(tab.title)}</span>
      </Sidebar>
    </>
  );
}
