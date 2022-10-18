import { ReactElement, useRef } from 'react';

import { useApp } from '../../index.js';
import { Preview } from '../Components/Preview/index.js';
import { Sidebar } from '../Components/Sidebar/index.js';
import { GuiEditorTabs } from '../index.js';
import styles from './index.module.css';

interface PagesTabProps {
  tab: GuiEditorTabs;
  isOpenLeft: boolean;
  isOpenRight: boolean;
}

export function PagesTab({ isOpenLeft, isOpenRight, tab }: PagesTabProps): ReactElement {
  const { app } = useApp();
  const frame = useRef<HTMLIFrameElement>();

  return (
    <>
      <Sidebar isOpen={isOpenLeft} type="left">
        <span className="text-2xl font-bold">{tab.title}</span>
      </Sidebar>
      <div className={styles.root}>
        <Preview app={app} iframeRef={frame} />
      </div>
      <Sidebar isOpen={isOpenRight} type="right">
        <span className="text-2xl font-bold">{tab.title}</span>
      </Sidebar>
    </>
  );
}
