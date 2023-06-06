import { Button, useData, useMessages, useMeta } from '@appsemble/react-components';
import { type App, type AppDefinition } from '@appsemble/types';
import axios from 'axios';
import { type ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { type MessageDescriptor, useIntl } from 'react-intl';
import { Link, Navigate, useLocation, useMatch } from 'react-router-dom';
import { type Document, type Node, type ParsedNode, parseDocument, stringify } from 'yaml';

import { GeneralTab } from './GeneralTab/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';
import { PagesTab } from './PagesTab/index.js';
import { ResourcesTab } from './ResourcesTab/index.js';
import { SecurityTab } from './SecurityTab/index.js';
import { ThemeTab } from './ThemeTab/index.js';
import { getAppUrl } from '../../../../utils/getAppUrl.js';
import { useApp } from '../index.js';

type TabTypes = 'general' | 'pages' | 'resources' | 'security' | 'theme';
export interface GuiEditorTabs {
  tabName: TabTypes;
  title: MessageDescriptor;
  icon: string;
  path: string;
}
const tabs: GuiEditorTabs[] = [
  {
    title: messages.generalTab,
    path: 'general',
    tabName: 'general',
    icon: 'fas fa-cog',
  },
  {
    title: messages.resourcesTab,
    path: 'resources',
    tabName: 'resources',
    icon: 'fas fa-database',
  },
  {
    title: messages.pagesTab,
    path: 'pages',
    tabName: 'pages',
    icon: 'fa-regular fa-file',
  },
  {
    title: messages.themeTab,
    path: 'theme',
    tabName: 'theme',
    icon: 'fas fa-palette',
  },
  {
    title: messages.securityTab,
    path: 'security',
    tabName: 'security',
    icon: 'fas fa-lock',
  },
];

export default function EditPage(): ReactElement {
  useMeta(messages.title);
  const { formatMessage } = useIntl();
  const { app, setApp } = useApp();
  const docRef = useRef<Document<ParsedNode>>();
  if (!docRef.current) {
    docRef.current = parseDocument(app.yaml);
  }
  const [saveStack, setSaveStack] = useState([docRef.current.clone()]);
  const [index, setIndex] = useState(0);
  const frame = useRef<HTMLIFrameElement>();
  const push = useMessages();
  const { data: coreStyle } = useData<string>(`/api/apps/${app.id}/style/core`);
  const { data: sharedStyle } = useData<string>(`/api/apps/${app.id}/style/shared`);
  const location = useLocation();
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  const match = useMatch('/:lang/apps/:id/edit/gui/*');
  const matchTabPath = useMatch('/:lang/apps/:id/edit/gui/:tab/*');
  const { id, lang } = match.params;
  const tabPath = matchTabPath?.params.tab;
  const currentTab = tabs.find((tab) => tab.path === tabPath) || tabs[2];

  const handleLeftPanelToggle = useCallback(() => {
    setLeftPanelOpen((open) => !open);
  }, []);

  const handleRightPanelToggle = useCallback(() => {
    setRightPanelOpen((open) => !open);
  }, []);

  const addSaveState = useCallback((): void => {
    const copy = saveStack.slice(0, index + 1);
    const clone = docRef.current.clone();
    copy.push(clone);
    setSaveStack(copy);
    setIndex(copy.length - 1);
  }, [docRef, saveStack, index, setIndex, setSaveStack]);

  const deleteIn = (path: Iterable<unknown>): void => {
    docRef.current.deleteIn(path);
    addSaveState();
  };

  const addIn = (path: Iterable<unknown>, value: Node): void => {
    docRef.current.addIn(path, value);
    addSaveState();
  };

  const changeIn = (path: Iterable<unknown>, value: Node): void => {
    docRef.current.setIn(path, value);
    addSaveState();
  };

  const onUndo = (): void => {
    setIndex((currentIndex) => Math.max(0, currentIndex - 1));
  };

  const onRedo = (): void => {
    setIndex((currentIndex) => Math.min(saveStack.length - 1, currentIndex + 1));
  };

  const updateAppPreview = useCallback(() => {
    const definition = app.definition as AppDefinition;
    delete definition.anchors;
    if (!app.path) {
      return;
    }
    frame.current?.contentWindow.postMessage(
      { type: 'editor/gui/EDIT_SUCCESS', definition },
      getAppUrl(app.OrganizationId, app.path),
    );
  }, [app, frame]);

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
    } catch (error: any) {
      push({
        body: `${formatMessage(messages.failed)} ${error}`,
        color: 'danger',
      });
    }
    updateAppPreview();
  }, [app, coreStyle, formatMessage, push, setApp, sharedStyle, updateAppPreview]);

  useEffect(() => {
    updateAppPreview();
  }, [setApp, updateAppPreview]);

  useEffect(() => {
    setApp((currApp) => ({ ...currApp, definition: saveStack[index].toJS() }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  if (!location.pathname || !tabs.some((tab) => tab.path === tabPath)) {
    return <Navigate to={{ ...location, pathname: `/${lang}/apps/${id}/edit/gui/pages` }} />;
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
            <li className={tab.path === tabPath ? 'is-active' : ''} key={tab.tabName}>
              <Link to={tab.path}>
                <span className="icon">
                  <i aria-hidden="true" className={tab.icon} />
                </span>
                <span>{formatMessage(tab.title)}</span>
              </Link>
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
          <PagesTab
            addIn={addIn}
            changeIn={changeIn}
            deleteIn={deleteIn}
            docRef={docRef}
            frameRef={frame}
            index={index}
            isOpenLeft={leftPanelOpen}
            isOpenRight={rightPanelOpen}
            onRedo={onRedo}
            onUndo={onUndo}
            stackSize={saveStack.length}
          />
        )}
        {currentTab.tabName === 'theme' && (
          <ThemeTab isOpenLeft={leftPanelOpen} isOpenRight={rightPanelOpen} />
        )}
        {currentTab.tabName === 'security' && (
          <SecurityTab isOpenLeft={leftPanelOpen} isOpenRight={rightPanelOpen} />
        )}
      </div>
    </div>
  );
}
