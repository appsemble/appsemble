import { type ReactNode } from 'react';
import { useIntl } from 'react-intl';

import styles from './index.module.css';
import { Sidebar } from '../Components/Sidebar/index.js';
import { type GuiEditorTabs } from '../index.js';

interface ResourcesTabProps {
  readonly tab: GuiEditorTabs;
  readonly isOpenLeft: boolean;
  readonly isOpenRight: boolean;
}
export function ResourcesTab({ isOpenLeft, isOpenRight, tab }: ResourcesTabProps): ReactNode {
  const { formatMessage } = useIntl();
  return (
    <>
      <Sidebar isOpen={isOpenLeft} type="left">
        <span className="text-2xl font-bold">{}</span>
      </Sidebar>
      <div className={styles.root}>
        {`${formatMessage(
          tab.title,
        )} will be added in a future version.\n Please use the code editor to create and edit resources.`}
      </div>
      <Sidebar isOpen={isOpenRight} type="right">
        <span className="text-2xl font-bold">{}</span>
      </Sidebar>
    </>
  );
}
