import { getAppBlocks, noop, normalize } from '@appsemble/lang-sdk';
import {
  Button,
  useBeforeUnload,
  useClosableOnDesktopSideMenu,
  useData,
  useMessages,
  useMeta,
  useToggle,
} from '@appsemble/react-components';
import { type App, type AppDefinition } from '@appsemble/types';
import axios from 'axios';
import classNames from 'classnames';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { InputList } from './Components/InputList/index.js';
import { GeneralTab } from './GeneralTab/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';
import { PagesTab } from './PagesTab/index.js';
import { ResourcesTab } from './ResourcesTab/index.js';
import { SecurityTab } from './SecurityTab/index.js';
import { StyleTab } from './StyleTab/index.js';
import { ThemeTab } from './ThemeTab/index.js';
import { useBreadCrumbsDecoration } from '../../../../components/BreadCrumbsDecoration/index.js';
import { useFullscreenContext } from '../../../../components/FullscreenProvider/index.js';
import { getCachedBlockVersions } from '../../../../components/MonacoEditor/appValidation/index.js';
// This import is required to prevent the 'unexpected usage' bug.
import '../../../../components/MonacoEditor/custom.js';
import { getAppUrl } from '../../../../utils/getAppUrl.js';
import { useApp } from '../index.js';

type TabTypes = 'general' | 'pages' | 'resources' | 'security' | 'style' | 'theme';
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
    title: messages.styleTab,
    path: 'style',
    tabName: 'style',
    icon: 'fas fa-pen',
  },
  {
    title: messages.securityTab,
    path: 'security',
    tabName: 'security',
    icon: 'fas fa-lock',
  },
];

export default function EditPage(): ReactNode {
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
  const { data: coreStyle, setData: setCoreStyle } = useData<string>(
    `/api/apps/${app.id}/style/core`,
  );
  const { data: sharedStyle } = useData<string>(`/api/apps/${app.id}/style/shared`);
  const location = useLocation();
  const [unsaved, setUnsaved] = useState<string[]>([
    `${formatMessage(messages.unsavedChanges)}:\n`,
  ]);
  const params = useParams();
  const { id } = params;
  const tabPath = Object.values(params)[0];
  const currentTab = tabs.find((tab) => tab.path === tabPath) || tabs[2];
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(currentTab.tabName !== 'resources');
  const screenRatios = useMemo(() => ['desktop', 'fill', 'phone', 'tablet'], []);
  const { enterFullscreen, exitFullscreen, fullscreen } = useFullscreenContext();

  const [selectedRatio, setSelectedRatio] = useState<string>('fill');
  const [propsTabToggle, setPropsTabToggle] = useState(true);
  const [blocksTabToggle, setBlocksTabToggle] = useState(false);
  const [hideInputListLabel, setHideInputListLabel] = useState(false);
  const toggleResourceDefinition = useToggle();
  const toggleResourceDetails = useToggle();
  const [, setBreadCrumbsDecoration] = useBreadCrumbsDecoration();

  useClosableOnDesktopSideMenu();

  useEffect(() => {
    setBreadCrumbsDecoration(
      <Link
        className={`mb-3 mr-1 ${styles.codeEditorSwitch}`}
        id="codeEditorSwitch"
        to={`apps/${id}/${normalize(app.definition.name)}/edit#editor`}
      >
        <Button className="button is-fullwidth is-rounded is-transparent is-bordered is-small">
          {formatMessage(messages.switchToCodeEditor)}
        </Button>
      </Link>,
    );

    return () => {
      setBreadCrumbsDecoration(null);
    };
  }, [formatMessage, location, setBreadCrumbsDecoration, id, app.definition.name]);

  const handleGoBack = (): void => {
    if (toggleResourceDefinition.enabled) {
      toggleResourceDefinition.disable();
    }
    if (toggleResourceDetails.enabled) {
      toggleResourceDetails.disable();
    }
  };

  // TODO fix all of these
  const guiEditorContainer = document?.querySelector(
    `.${styles.guiEditorContainer}`,
  ) as HTMLElement;
  const appPreviewDiv = document?.querySelector('#appPreviewDiv') as HTMLElement;
  const breadcrumbs = document?.querySelector('#breadcrumbs') as HTMLElement;
  const breadcrumbsDiv = document?.querySelector('#breadcrumbsDiv') as HTMLElement;
  const codeEditorSwitch = document?.querySelector('#codeEditorSwitch') as HTMLElement;
  const controlsDiv = document?.querySelector(`.${styles.controls}`) as HTMLElement;
  const rightBar = document?.querySelector('#rightBar') as HTMLElement;
  const leftBar = document?.querySelector('#leftBar') as HTMLElement;
  const sideMenu = document?.querySelector('#sideMenu') as HTMLElement;
  const sideMenuWrapper = document?.querySelector('#sideMenuWrapper') as HTMLElement;
  const tabButtonTexts = document?.querySelectorAll('.tab-btn-text') as NodeListOf<HTMLElement>;
  const tabButtonLinks = document?.querySelectorAll('.tab-btn-link') as NodeListOf<HTMLElement>;
  const tabButtonIcons = document?.querySelectorAll('.tab-btn-icon') as NodeListOf<HTMLElement>;
  const rightSliderPanel = document?.querySelector(`.${styles.panelSliderRight}`) as HTMLElement;
  const pagesTabTopRightPanelButtons = document?.querySelectorAll(
    "[class*='pages-right-tab-btn']",
  ) as NodeListOf<HTMLElement>;

  useEffect(() => {
    const setInputListLabelVisibility = (): void => {
      const totalWidth = breadcrumbsDiv?.clientWidth;
      const breadcrumbsWidth = breadcrumbs?.clientWidth;
      const switchButtonWidth = codeEditorSwitch?.clientWidth;
      const controlsWidth = controlsDiv?.clientWidth;
      const freeSpace = totalWidth - (breadcrumbsWidth + switchButtonWidth);
      if (freeSpace < controlsWidth) {
        if (!hideInputListLabel) {
          setHideInputListLabel(true);
        }
      } else {
        if (hideInputListLabel && freeSpace >= controlsWidth + 127) {
          setHideInputListLabel(false);
        }
      }
    };

    const setContainerSize = (): void => {
      if (guiEditorContainer) {
        const windowHeight =
          window?.innerHeight ||
          document?.documentElement.clientHeight ||
          document?.body?.clientHeight;

        guiEditorContainer.style.height = `${windowHeight - 165}px`;
      }
    };

    const setAppPreviewSize = (): void => {
      if (selectedRatio && appPreviewDiv && guiEditorContainer && leftBar && rightBar) {
        const windowHeight = guiEditorContainer.clientHeight;
        const windowWidth = guiEditorContainer.clientWidth;

        switch (selectedRatio) {
          case 'phone':
            appPreviewDiv.style.removeProperty('width');
            appPreviewDiv.style.height = `${windowHeight - 70}px`;
            break;
          case 'tablet':
            appPreviewDiv.style.removeProperty('width');
            appPreviewDiv.style.height = `${windowHeight - 90}px`;
            break;
          case 'desktop':
            appPreviewDiv.style.removeProperty('height');
            appPreviewDiv.style.width = `${
              windowWidth - leftBar.clientWidth - rightBar.clientWidth - 70
            }px`;
            break;
          case 'fill':
            appPreviewDiv.style.removeProperty('width');
            appPreviewDiv.style.height = '100%';
            break;
          default:
            noop();
            break;
        }
      }
    };

    const toggleRightBarButtonsText = (): void => {
      if (rightSliderPanel?.clientWidth < 242) {
        for (const button of pagesTabTopRightPanelButtons) {
          button.classList.add('no-text');
        }
      } else {
        for (const button of pagesTabTopRightPanelButtons) {
          button.classList.remove('no-text');
        }
      }
    };

    const handleTransitionEnd = (event: TransitionEvent): void => {
      if (event.propertyName === 'width') {
        setAppPreviewSize();
      } else {
        setInputListLabelVisibility();
      }
      toggleRightBarButtonsText();
    };

    setContainerSize();
    setAppPreviewSize();
    setInputListLabelVisibility();

    const onResize = (): void => {
      setInputListLabelVisibility();
      setContainerSize();
      setAppPreviewSize();
    };

    window.addEventListener('resize', onResize);
    leftBar?.addEventListener('transitionend', handleTransitionEnd);
    rightBar?.addEventListener('transitionend', handleTransitionEnd);

    if (window?.innerWidth > 1024) {
      sideMenu?.addEventListener('transitionend', handleTransitionEnd);
      sideMenuWrapper?.addEventListener('transitionend', handleTransitionEnd);
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === guiEditorContainer) {
          setContainerSize();
          setAppPreviewSize();

          if (tabButtonTexts && tabButtonLinks) {
            if (guiEditorContainer.clientWidth < 1100) {
              if (guiEditorContainer.clientWidth < 900) {
                for (const element of tabButtonIcons) {
                  if (element.classList.contains('shrink')) {
                    element.classList.remove('shrink');
                  }
                  element.classList.add('no-text');
                }
                for (const element of tabButtonLinks) {
                  if (element.classList.contains('shrink')) {
                    element.classList.remove('shrink');
                  }
                  element.classList.add('no-text');
                }
                for (const element of tabButtonTexts) {
                  if (element.classList.contains('shrink')) {
                    element.classList.remove('shrink');
                  }
                  element.classList.add('no-text');
                }
              } else {
                for (const element of tabButtonIcons) {
                  if (element.classList.contains('no-text')) {
                    element.classList.remove('no-text');
                  }
                  element.classList.add('shrink');
                }
                for (const element of tabButtonLinks) {
                  if (element.classList.contains('no-text')) {
                    element.classList.remove('no-text');
                  }
                  element.classList.add('shrink');
                }
                for (const element of tabButtonTexts) {
                  if (element.classList.contains('no-text')) {
                    element.classList.remove('no-text');
                  }
                }
              }
            } else {
              for (const element of tabButtonIcons) {
                if (element.classList.contains('no-text')) {
                  element.classList.remove('no-text');
                }
                if (element.classList.contains('shrink')) {
                  element.classList.remove('shrink');
                }
              }
              for (const element of tabButtonLinks) {
                if (element.classList.contains('no-text')) {
                  element.classList.remove('no-text');
                }
                if (element.classList.contains('shrink')) {
                  element.classList.remove('shrink');
                }
              }
              for (const element of tabButtonTexts) {
                if (element.classList.contains('no-text')) {
                  element.classList.remove('no-text');
                }
              }
            }
          }

          if (rightSliderPanel?.clientWidth < 242) {
            for (const button of pagesTabTopRightPanelButtons) {
              button.classList.add('no-text');
            }
          } else {
            for (const button of pagesTabTopRightPanelButtons) {
              button.classList.remove('no-text');
            }
          }
        }
      }
    });

    if (guiEditorContainer) {
      resizeObserver.observe(guiEditorContainer);
    }

    return () => {
      window.removeEventListener('resize', onResize);
      leftBar?.removeEventListener('transitionend', handleTransitionEnd);
      rightBar?.removeEventListener('transitionend', handleTransitionEnd);
      if (window?.innerWidth > 1024) {
        sideMenu?.removeEventListener('transitionend', handleTransitionEnd);
        sideMenuWrapper?.removeEventListener('transitionend', handleTransitionEnd);
      }
      if (guiEditorContainer) {
        resizeObserver.unobserve(guiEditorContainer);
      }
    };
  }, [
    appPreviewDiv,
    breadcrumbs,
    breadcrumbsDiv,
    codeEditorSwitch,
    controlsDiv,
    guiEditorContainer,
    hideInputListLabel,
    leftBar,
    pagesTabTopRightPanelButtons,
    rightBar,
    rightSliderPanel,
    selectedRatio,
    sideMenu,
    sideMenuWrapper,
    tabButtonIcons,
    tabButtonLinks,
    tabButtonTexts,
  ]);

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

  const onUndo = useCallback((): void => {
    setIndex((currentIndex) => Math.max(0, currentIndex - 1));
  }, []);

  const onRedo = useCallback((): void => {
    setIndex((currentIndex) => Math.min(saveStack.length - 1, currentIndex + 1));
  }, [saveStack.length]);

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
      if (currentTab.tabName === 'resources') {
        setUnsaved([`${formatMessage(messages.unsavedChanges)}\n`]);
        setSaveStack([docRef.current.clone()]);
        setIndex(0);
        docRef.current = undefined;
      }
    }
  }, [
    app.id,
    coreStyle,
    currentTab.tabName,
    formatMessage,
    getErrorMessage,
    index,
    push,
    saveStack,
    setApp,
    sharedStyle,
  ]);

  const onChangeScreenRatio = useCallback(
    (i: number) => {
      setSelectedRatio(screenRatios[i]);
    },
    [screenRatios, setSelectedRatio],
  );

  const unsavedChanges = getUnsavedChanges().length !== 1;

  useBeforeUnload(unsavedChanges);

  useEffect(() => {
    updateAppPreview();
  }, [setIndex, updateAppPreview]);

  if (!location.pathname || !tabs.some((tab) => tab.path === tabPath)) {
    return <Navigate to="pages" />;
  }

  const handlePropertiesToggle = (): void => {
    if (!propsTabToggle) {
      setPropsTabToggle(() => true);
      setBlocksTabToggle(() => false);
    }
  };

  const handleBlocksToggle = (): void => {
    if (!blocksTabToggle) {
      setBlocksTabToggle(() => true);
      setPropsTabToggle(() => false);
    }
  };

  return (
    <>
      <div className={classNames('is-flex', styles.controls)}>
        <InputList
          className={classNames({
            'is-hidden': currentTab.tabName === 'resources',
          })}
          hideLabel={hideInputListLabel}
          isRight
          label={String(formatMessage(messages.previewFormat))}
          labelPosition="left"
          onChange={(i: number) => onChangeScreenRatio(i)}
          options={screenRatios}
          value={selectedRatio}
        />
        {fullscreen.enabled ? (
          <Button icon="compress" iconSize="medium" onClick={exitFullscreen}>
            {String(formatMessage(messages.exitFullscreen))}
          </Button>
        ) : (
          <Button icon="expand" iconSize="medium" onClick={enterFullscreen}>
            {String(formatMessage(messages.enterFullscreen))}
          </Button>
        )}
      </div>
      <div className="container is-fluid px-1" id="contentContainer">
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
                <Link
                  className="tab-btn-link"
                  onClick={() => {
                    if (tab.tabName === 'resources') {
                      if (rightPanelOpen) {
                        setRightPanelOpen(false);
                      }
                    } else {
                      setRightPanelOpen(true);
                    }
                  }}
                  to={tab.path}
                >
                  <span className="icon tab-btn-icon">
                    <i aria-hidden="true" className={tab.icon} />
                  </span>
                  <span className="tab-btn-text">{formatMessage(tab.title)}</span>
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
              className={classNames('is-primary', {
                'is-hidden': currentTab.tabName === 'resources',
              })}
              icon={rightPanelOpen ? 'angles-right' : 'angles-left'}
              onClick={handleRightPanelToggle}
            />

            <div
              className={classNames(styles.panelSliderRight, {
                [styles.isOpen]: rightPanelOpen,
                [styles.isClosed]: !rightPanelOpen,
                'is-hidden': currentTab.tabName === 'resources',
              })}
            >
              {currentTab.tabName === 'pages' && (
                <>
                  <Button
                    className={`pages-right-tab-btn ${propsTabToggle ? 'toggled' : 'toggle'}`}
                    icon="sliders"
                    onClick={handlePropertiesToggle}
                  >
                    Properties
                  </Button>
                  <Button
                    className={`pages-right-tab-btn ${blocksTabToggle ? 'toggled' : 'toggle'}`}
                    icon="cubes"
                    onClick={handleBlocksToggle}
                  >
                    Blocks
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        <div
          className={classNames(`${styles.guiEditorContainer} m-0 p-0`, {
            [String(styles.fullscreen)]: fullscreen.enabled,
          })}
        >
          {currentTab.tabName === 'general' && (
            <GeneralTab
              changeIn={changeIn}
              deleteIn={deleteIn}
              docRef={docRef}
              frameRef={frame}
              isOpenLeft={leftPanelOpen}
              isOpenRight={rightPanelOpen}
              selectedScreenRatio={selectedRatio}
            />
          )}
          {currentTab.tabName === 'resources' && (
            <>
              <ResourcesTab
                addIn={addIn}
                changeIn={changeIn}
                deleteIn={deleteIn}
                docRef={docRef}
                goBack={handleGoBack}
                handleSave={handleSave}
                isOpenLeft={leftPanelOpen}
                isOpenRight={rightPanelOpen}
                isShowingDefinition={toggleResourceDefinition.enabled}
                isShowingDetails={toggleResourceDetails.enabled}
                saveStack={saveStack[index]}
                showResourceDefinition={toggleResourceDefinition.enable}
                showResourceDetails={toggleResourceDetails.enable}
                toggleRightPanel={handleRightPanelToggle}
              />
              {toggleResourceDetails.enabled || toggleResourceDefinition.enabled ? (
                <Button
                  className={classNames(
                    'is-danger is-rounded is-light mt-3',
                    String(styles.goBack),
                    {
                      [styles.rightBar]: rightPanelOpen,
                    },
                  )}
                  icon="arrow-left-long"
                  iconSize="medium"
                  onClick={handleGoBack}
                />
              ) : null}
            </>
          )}
          {currentTab.tabName === 'pages' && (
            <PagesTab
              addIn={addIn}
              blocksTabShow={blocksTabToggle}
              changeIn={changeIn}
              deleteIn={deleteIn}
              docRef={docRef}
              isOpenLeft={leftPanelOpen}
              isOpenRight={rightPanelOpen}
              propsTabShow={propsTabToggle}
              saveStack={saveStack[index]}
              selectedResolution={selectedRatio}
              toggleProps={handlePropertiesToggle}
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
              saveStack={saveStack[index]}
              selectedAspectRatio={selectedRatio}
            />
          )}
          {currentTab.tabName === 'style' && (
            <StyleTab
              changeIn={changeIn}
              coreStyle={coreStyle}
              docRef={docRef}
              frameRef={frame}
              isOpenLeft={leftPanelOpen}
              isOpenRight={rightPanelOpen}
              saveStack={saveStack[index]}
              selectedResolution={selectedRatio}
              setCoreStyle={setCoreStyle}
            />
          )}
          {currentTab.tabName === 'security' && (
            <SecurityTab
              isOpenLeft={leftPanelOpen}
              isOpenRight={rightPanelOpen}
              selectedAspectRatio={selectedRatio}
            />
          )}
        </div>
      </div>
    </>
  );
}
