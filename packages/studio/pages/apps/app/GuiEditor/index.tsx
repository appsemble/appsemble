import { Button, useMeta } from '@appsemble/react-components';
import { ReactElement, useCallback, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { GeneralTab } from './GeneralTab/index.js';
import styles from './index.module.css';
import { PagesTab } from './PagesTab/index.js';
import { ResourcesTab } from './ResourcesTab/index.js';
import { SecurityTab } from './SecurityTab/index.js';
import { ThemeTab } from './ThemeTab/index.js';

type TabTypes = 'general' | 'pages' | 'resources' | 'security' | 'theme';
export interface GuiEditorTabs {
  tabName: TabTypes;
  title: string;
  icon: string;
  hash: string;
}
const tabs: GuiEditorTabs[] = [
  {
    title: 'General',
    hash: '#general',
    tabName: 'general',
    icon: 'fas fa-cog',
  },
  {
    title: 'Resources',
    hash: '#resources',
    tabName: 'resources',
    icon: 'fas fa-database',
  },
  {
    title: 'Pages',
    hash: '#pages',
    tabName: 'pages',
    icon: 'fa-regular fa-file',
  },
  {
    title: 'Theme',
    hash: '#theme',
    tabName: 'theme',
    icon: 'fas fa-palette',
  },
  {
    title: 'Security',
    hash: '#security',
    tabName: 'security',
    icon: 'fas fa-lock',
  },
];

export default function EditPage(): ReactElement {
  useMeta('GUI Editor');
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

  const handleSave = useCallback(() => {
    /* TODO: Save the app */
  }, []);

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
                <span>{tab.title}</span>
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
      {currentTab.tabName === 'general' && <GeneralTab tab={currentTab} />}
      {currentTab.tabName === 'resources' && <ResourcesTab tab={currentTab} />}
      {currentTab.tabName === 'pages' && <PagesTab tab={currentTab} />}
      {currentTab.tabName === 'theme' && <ThemeTab tab={currentTab} />}
      {currentTab.tabName === 'security' && <SecurityTab tab={currentTab} />}
    </div>
  );
}
