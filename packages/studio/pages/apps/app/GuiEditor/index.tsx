import {
  Button,
  useBeforeUnload,
  useData,
  useMessages,
  useMeta,
} from '@appsemble/react-components';
import { type App, type AppDefinition, type PageDefinition } from '@appsemble/types';
import axios from 'axios';
import { type ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { type MessageDescriptor, useIntl } from 'react-intl';
import { Link, Navigate, useLocation, useMatch } from 'react-router-dom';
import {
  type Document,
  type Node,
  type ParsedNode,
  parseDocument,
  stringify,
  type YAMLMap,
  type YAMLSeq,
} from 'yaml';

import { GeneralTab } from './GeneralTab/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';
import { PagesTab } from './PagesTab/index.js';
import { ResourcesTab } from './ResourcesTab/index.js';
import { SecurityTab } from './SecurityTab/index.js';
import { ThemeTab } from './ThemeTab/index.js';
import { UndoRedo } from './UndoRedo/index.js';
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

  const getErrorMessage = useCallback(
    (error: any): string => {
      const definition = saveStack[index];
      const empty = (definition.getIn(['pages']) as YAMLSeq).items.map((page: YAMLMap) => {
        if (!page.getIn(['type']) || page.getIn(['type']) === 'page') {
          return page.getIn(['blocks']) === 0;
        }
        if (page.getIn(['type']) === 'flow') {
          return (page.getIn(['steps']) as YAMLSeq).items.flatMap(
            (subPage: any) => subPage.getIn(['blocks']) === 0,
          );
        }
        if (page.getIn(['type']) === 'tabs') {
          return (page.getIn(['tabs']) as YAMLSeq).items.flatMap(
            (subPage: any) => subPage.getIn(['blocks']) === 0,
          );
        }
      });
      if (empty) {
        return 'A page must have at least one block';
      }
      if (definition.errors.length > 0) {
        return 'A YAML error has occured';
      }
      return error;
    },
    [index, saveStack],
  );

  const updateAppPreview = useCallback(() => {
    const definition = saveStack[index].toJS() as AppDefinition;
    delete definition.anchors;
    frame.current?.contentWindow.postMessage(
      { type: 'editor/gui/EDIT_SUCCESS', definition, coreStyle, sharedStyle },
      getAppUrl(app.OrganizationId, app.path),
    );
  }, [app.OrganizationId, app.path, coreStyle, index, saveStack, sharedStyle]);

  const handleSave = useCallback(async () => {
    const ymlString = stringify(saveStack[index]);
    try {
      const formData = new FormData();
      formData.append('yaml', ymlString);
      formData.append('coreStyle', coreStyle);
      formData.append('sharedStyle', sharedStyle);
      const { data } = await axios.patch<App>(`/api/apps/${app.id}`, formData);
      setApp(data);
      push({ body: formatMessage(messages.saved), color: 'success' });
    } catch (error: any) {
      const message = getErrorMessage(error);
      push({
        body: `${formatMessage(messages.failed)} ${message}`,
        color: 'danger',
      });
    }
  }, [
    app.id,
    coreStyle,
    formatMessage,
    getErrorMessage,
    index,
    push,
    saveStack,
    setApp,
    sharedStyle,
  ]);

  // eslint-disable-next-line unicorn/consistent-function-scoping
  const equalityCheck = (old: object, cur: object): string => {
    // If both have no theme
    if (old === cur) {
      return '';
    }
    // If theme was added
    if (cur && !old) {
      return 'added';
    }
    // If theme was removed
    if (!cur && old) {
      return 'removed';
    }
    // If both exist and are not equal
    let changes = 'Changed: ';
    for (const key in old) {
      if (cur[key] !== old[key]) {
        changes += `${key}, `;
      }
    }
    for (const key in cur) {
      if (cur[key] && !old[key]) {
        changes += `${key}, `;
      }
    }
    if (changes !== 'Changed: ') {
      return changes;
    }
  };

  const getUnsavedChanges = useCallback(() => {
    const unsavedChanges: string[] = ['Unsaved changes:\n'];
    const old = app.definition;
    const cur = saveStack[index].toJS();
    // General tab changes
    if (old.name !== cur.name) {
      unsavedChanges.push(`Name:  ${cur.name}\n`);
    }
    if (old.description !== cur.description) {
      unsavedChanges.push(`Description: ${cur.description}\n`);
    }
    if (old.defaultPage !== cur.defaultPage) {
      unsavedChanges.push(`Default page: ${cur.defaultPage}\n`);
    }
    if (old.layout.login !== cur.layout.login) {
      unsavedChanges.push(`Login: ${cur.layout.login}\n`);
    }
    if (old.layout.settings !== cur.layout.settings) {
      unsavedChanges.push(`Settings: ${cur.layout.settings}\n`);
    }
    if (old.layout.feedback !== cur.layout.feedback) {
      unsavedChanges.push(`Feedback: ${cur.layout.feedback}\n`);
    }
    if (old.layout.navigation !== cur.layout.navigation) {
      unsavedChanges.push(`Navigation: ${cur.layout.navigation}\n`);
    }
    // Theme tab
    let changeString = equalityCheck(old.theme, cur.theme);
    if (changeString) {
      unsavedChanges.push(`Default theme ${changeString}\n`);
    }
    // eslint-disable-next-line unicorn/no-array-for-each
    cur.pages.forEach((page: PageDefinition, pageIndex: number) => {
      changeString = equalityCheck(old.pages[pageIndex].theme, page.theme);
      if (changeString) {
        unsavedChanges.push(`Page '${page.name}' theme ${changeString}\n`);
      }
    });

    // Empty the array when there are no unsaved changes.
    if (unsavedChanges.length === 1) {
      unsavedChanges.pop();
    }
    return unsavedChanges.join('');
  }, [app.definition, index, saveStack]);

  useBeforeUnload(docRef.current !== saveStack[index]);

  useEffect(() => {
    updateAppPreview();
  }, [setIndex, updateAppPreview]);

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
        <UndoRedo index={index} onRedo={onRedo} onUndo={onUndo} stackSize={saveStack.length} />
        <Button
          className="is-align-content-flex-end"
          disabled={getUnsavedChanges().length < 0}
          icon="save"
          onClick={handleSave}
          title={getUnsavedChanges()}
        />
        <div className={styles.panelTopRight}>
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
          <GeneralTab
            changeIn={changeIn}
            deleteIn={deleteIn}
            docRef={docRef}
            frameRef={frame}
            isOpenLeft={leftPanelOpen}
            isOpenRight={rightPanelOpen}
          />
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
            isOpenLeft={leftPanelOpen}
            isOpenRight={rightPanelOpen}
          />
        )}
        {currentTab.tabName === 'theme' && (
          <ThemeTab
            changeIn={changeIn}
            deleteIn={deleteIn}
            docRef={docRef}
            frameRef={frame}
            isOpenLeft={leftPanelOpen}
            isOpenRight={rightPanelOpen}
          />
        )}
        {currentTab.tabName === 'security' && (
          <SecurityTab isOpenLeft={leftPanelOpen} isOpenRight={rightPanelOpen} />
        )}
      </div>
    </div>
  );
}
