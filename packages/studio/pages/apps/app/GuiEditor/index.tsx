import { Button, useData, useMessages, useMeta } from '@appsemble/react-components';
import { App } from '@appsemble/types';
import axios from 'axios';
import { ReactElement, useCallback, useState } from 'react';
import { MessageDescriptor, useIntl } from 'react-intl';
import { Navigate, useLocation } from 'react-router-dom';
import { stringify } from 'yaml';

import { useApp } from '../index.js';
import { GeneralTab } from './GeneralTab/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';
import { PagesTab } from './PagesTab/index.js';
import { ResourcesTab } from './ResourcesTab/index.js';
import { SecurityTab } from './SecurityTab/index.js';
import { ThemeTab } from './ThemeTab/index.js';

type TabTypes = 'general' | 'pages' | 'resources' | 'security' | 'theme';
export interface GuiEditorTabs {
  tabName: TabTypes;
  title: MessageDescriptor;
  icon: string;
  hash: string;
}
const tabs: GuiEditorTabs[] = [
  {
    title: messages.generalTab,
    hash: '#general',
    tabName: 'general',
    icon: 'fas fa-cog',
  },
  {
    title: messages.resourcesTab,
    hash: '#resources',
    tabName: 'resources',
    icon: 'fas fa-database',
  },
  {
    title: messages.pagesTab,
    hash: '#pages',
    tabName: 'pages',
    icon: 'fa-regular fa-file',
  },
  {
    title: messages.themeTab,
    hash: '#theme',
    tabName: 'theme',
    icon: 'fas fa-palette',
  },
  {
    title: messages.securityTab,
    hash: '#security',
    tabName: 'security',
    icon: 'fas fa-lock',
  },
];

export default function EditPage(): ReactElement {
  useMeta(messages.title);
<<<<<<< HEAD
  const { formatMessage } = useIntl();
  const { app, setApp } = useApp();
  const push = useMessages();
  const { data: coreStyle } = useData<string>(`/api/apps/${app.id}/style/core`);
  const { data: sharedStyle } = useData<string>(`/api/apps/${app.id}/style/shared`);
=======
>>>>>>> f5da7b0da (Add translation in messages and applied suggestions)
  const location = useLocation();
  const currentTab = tabs.find((tab) => tab.hash === location.hash) || tabs[2];
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  const handleLeftPanelToggle = useCallback(() => {
    setLeftPanelOpen((open) => !open);
  }, []);

  const handleRightPanelToggle = useCallback(() => {
    setRightPanelOpen((open) => !open);
  }, []);

  const handleSave = useCallback(async () => {
    const ymlString = stringify(app.definition);
    try {
      const formData = new FormData();
      formData.append('yaml', ymlString);
      formData.append('coreStyle', coreStyle);
      formData.append('sharedStyle', sharedStyle);

      const { data } = await axios.patch<App>(`/api/apps/${app.id}`, formData);
      setApp(data);
      push({ body: formatMessage(messages.saved), color: 'success' });
    } catch {
      push({ body: formatMessage(messages.failed), color: 'danger' });
    }
  }, [app.definition, app.id, coreStyle, formatMessage, push, setApp, sharedStyle]);

  if (!location.hash || !tabs.some((tab) => tab.hash === location.hash)) {
    return <Navigate to={{ ...location, hash: '#pages' }} />;
  }

  return (
    <div className="container is-fluid">
      <div className={`tabs is-toggle ${styles.editorNavBar} mb-0`}>
        <div className={styles.panelTopLeft}>
          <div
            className={`${styles.panelSliderLeft} ${
              leftPanelOpen ? styles.isOpen : styles.isClosed
            }`}
          />
          <Button
            className="is-primary"
            icon={leftPanelOpen ? 'angles-left' : 'angles-right'}
            onClick={handleLeftPanelToggle}
          />
        </div>
        <ul>
          {tabs.map((tab) => (
            <li className={tab.hash === location.hash ? 'is-active' : ''} key={tab.tabName}>
              <a href={tab.hash}>
                <span className="icon">
                  <i aria-hidden="true" className={tab.icon} />
                </span>
                <span>{formatMessage(tab.title)}</span>
              </a>
            </li>
          ))}
        </ul>
        <div className={styles.panelTopRight}>
          <Button className="is-align-content-flex-end" icon="save" onClick={handleSave} />
          <Button
            className="is-primary"
            icon={rightPanelOpen ? 'angles-right' : 'angles-left'}
            onClick={handleRightPanelToggle}
          />
          <div
            className={`${styles.panelSliderRight} ${
              rightPanelOpen ? styles.isOpen : styles.isClosed
            }`}
          />
        </div>
      </div>
      <div className={`${styles.guiEditorContainer} m-0 p-0`}>
        {currentTab.tabName === 'general' && (
          <GeneralTab isOpenLeft={leftPanelOpen} isOpenRight={rightPanelOpen} />
        )}
        {currentTab.tabName === 'resources' && (
          <ResourcesTab isOpenLeft={leftPanelOpen} isOpenRight={rightPanelOpen} tab={currentTab} />
        )}
        {currentTab.tabName === 'pages' && (
          <PagesTab isOpenLeft={leftPanelOpen} isOpenRight={rightPanelOpen} tab={currentTab} />
        )}
        {currentTab.tabName === 'theme' && (
          <ThemeTab isOpenLeft={leftPanelOpen} isOpenRight={rightPanelOpen} tab={currentTab} />
        )}
        {currentTab.tabName === 'security' && (
          <SecurityTab isOpenLeft={leftPanelOpen} isOpenRight={rightPanelOpen} />
        )}
      </div>
    </div>
  );
}
