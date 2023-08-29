import {
  Button,
  useBeforeUnload,
  useData,
  useMessages,
  useMeta,
} from '@appsemble/react-components';
import { type App, type AppDefinition } from '@appsemble/types';
import { getAppBlocks } from '@appsemble/utils';
import axios from 'axios';
import { type ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { type MessageDescriptor, useIntl } from 'react-intl';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import {
  type Document,
  type Node,
  type ParsedNode,
  parseDocument,
  stringify,
  type YAMLMap,
  type YAMLSeq,
} from 'yaml';

import { BugButton } from './BugButton/index.js';
import { GeneralTab } from './GeneralTab/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';
import { PagesTab } from './PagesTab/index.js';
import { ResourcesTab } from './ResourcesTab/index.js';
import { SecurityTab } from './SecurityTab/index.js';
import { ThemeTab } from './ThemeTab/index.js';
import { getCachedBlockVersions } from '../../../../components/MonacoEditor/appValidation/index.js';
// This import is required to prevent the 'unexpected usage' bug.
import '../../../../components/MonacoEditor/custom.js';
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
  const [unsaved, setUnsaved] = useState<string[]>([
    `${formatMessage(messages.unsavedChanges)}:\n`,
  ]);
  const params = useParams();
  const { id, lang } = params;
  const tabPath = Object.values(params)[0];
  const currentTab = tabs.find((tab) => tab.path === tabPath) || tabs[2];

  const handleLeftPanelToggle = useCallback(() => {
    setLeftPanelOpen((open) => !open);
  }, []);

  const handleRightPanelToggle = useCallback(() => {
    setRightPanelOpen((open) => !open);
  }, []);

  const getUnsavedChanges = useCallback(() => {
    const unsavedChanges: string[] = unsaved;
    return unsavedChanges;
  }, [unsaved]);

  const addToUnsaved = useCallback(
    (change: string): void => {
      const newList = unsaved;
      if (newList.includes(change)) {
        return;
      }
      newList.push(change);
      setUnsaved(newList);
    },
    [unsaved],
  );

  const addSaveState = useCallback((): void => {
    const copy = saveStack.slice(0, index + 1);
    const clone = docRef.current.clone();
    copy.push(clone);
    setSaveStack(copy);
    setIndex(copy.length - 1);
  }, [docRef, saveStack, index, setIndex, setSaveStack]);

  const deleteIn = (path: Iterable<number | string>): void => {
    docRef.current.deleteIn(path);
    addSaveState();

    addToUnsaved(
      `Deleted: ${Array.from(path)
        .reverse()
        .find((item: number | string) => typeof item === 'string')}\n`,
    );
  };

  const addIn = (path: Iterable<number | string>, value: Node): void => {
    docRef.current.addIn(path, value);
    addSaveState();
    addToUnsaved(
      `${Array.from(path)
        .reverse()
        .find((item: number | string) => typeof item === 'string')}\n`,
    );
  };

  const changeIn = (path: Iterable<number | string>, value: Node): void => {
    docRef.current.setIn(path, value);
    addSaveState();
    addToUnsaved(
      `${Array.from(path)
        .reverse()
        .find((item: number | string) => typeof item === 'string')}\n`,
    );
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
      if (empty.includes(true)) {
        return formatMessage(messages.noBlocks);
      }
      if (definition.errors.length > 0) {
        return formatMessage(messages.yamlError);
      }
      if (error) {
        return `${formatMessage(messages.errorIn)} ${unsaved.join('')}`;
      }
      return formatMessage(messages.unknownError);
    },
    [formatMessage, index, saveStack, unsaved],
  );

  const updateAppPreview = useCallback(async () => {
    const definition = saveStack[index].toJS() as AppDefinition;
    const blockManifests = await getCachedBlockVersions(getAppBlocks(definition));
    delete definition.anchors;
    frame.current?.contentWindow.postMessage(
      { type: 'editor/EDIT_SUCCESS', definition, blockManifests, coreStyle, sharedStyle },
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
      setUnsaved([`${formatMessage(messages.unsavedChanges)}\n`]);
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

  const unsavedChanges = getUnsavedChanges().length !== 1;

  useBeforeUnload(unsavedChanges);

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
        <Button
          disabled={index < 1}
          icon="rotate-left"
          onClick={onUndo}
          title={`${formatMessage(messages.undo)}\n ${unsaved.slice(-1)}`}
        />
        <Button
          disabled={index >= saveStack.length - 1}
          icon="rotate-right"
          onClick={onRedo}
          title={`${formatMessage(messages.redo)}\n ${unsaved.slice(-1)}`}
        />
        <Button
          className={
            unsavedChanges
              ? `is-align-content-flex-end ${styles.highLight}`
              : 'is-align-content-flex-end'
          }
          icon="save"
          onClick={handleSave}
          title={
            getUnsavedChanges().join('') === `${formatMessage(messages.unsavedChanges)}:\n`
              ? ''
              : getUnsavedChanges().join('')
          }
        />
        <BugButton />
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
