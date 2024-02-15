import {
  Button,
  Loader,
  Modal,
  Prompt,
  Tabs,
  useBeforeUnload,
  useClickOutside,
  useConfirmation,
  useData,
  useEventListener,
  useMessages,
  useMeta,
  useToggle,
} from '@appsemble/react-components';
import { type App, type AppDefinition } from '@appsemble/types';
import { getAppBlocks, noop } from '@appsemble/utils';
import axios from 'axios';
import classNames from 'classnames';
import equal from 'fast-deep-equal';
import { editor } from 'monaco-editor/esm/vs/editor/editor.api.js';
import {
  type ReactNode,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { parse } from 'yaml';

import { EditorTab } from './EditorTab/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';
import { AppPreview } from '../../../../components/AppPreview/index.js';
import { useBreadCrumbsDecoration } from '../../../../components/BreadCrumbsDecoration/index.js';
import { useFullscreenContext } from '../../../../components/FullscreenProvider/index.js';
import { getCachedBlockVersions } from '../../../../components/MonacoEditor/appValidation/index.js';
import { MonacoEditor } from '../../../../components/MonacoEditor/index.js';
import { getAppUrl } from '../../../../utils/getAppUrl.js';
import { InputList } from '../GuiEditor/Components/InputList/index.js';
import { useApp } from '../index.js';

export default function EditPage(): ReactNode {
  useMeta(messages.title);

  const { app, setApp } = useApp();
  const { id } = app;

  const [appDefinition, setAppDefinition] = useState<string>(app.yaml);
  const {
    data: coreStyle,
    loading: coreStyleLoading,
    setData: setCoreStyle,
  } = useData<string>(`/api/apps/${id}/style/core`);
  const {
    data: sharedStyle,
    loading: sharedStyleLoading,
    setData: setSharedStyle,
  } = useData<string>(`/api/apps/${id}/style/shared`);

  const [appDefinitionErrorCount, setAppDefinitionErrorCount] = useState(0);
  const [coreStyleErrorCount, setCoreStyleErrorCount] = useState(0);
  const [sharedStyleErrorCount, setSharedStyleErrorCount] = useState(0);

  const [pristine, setPristine] = useState(true);

  const frame = useRef<HTMLIFrameElement>();
  const modalFrame = useRef<HTMLIFrameElement>();

  const dropdownBurgerButtonRef = useRef<HTMLButtonElement>();
  const buttonsDropDownRef = useRef<HTMLDivElement>();
  const editorRef = useRef<editor.IStandaloneCodeEditor>();
  const { formatMessage } = useIntl();
  const location = useLocation();
  const navigate = useNavigate();
  const push = useMessages();
  const { lang } = useParams();
  const [, setBreadCrumbsDecoration] = useBreadCrumbsDecoration();
  const screenRatios = useMemo(() => ['desktop', 'fill', 'phone', 'tablet'], []);
  const [selectedRatio, setSelectedRatio] = useState<string>('fill');
  const { enterFullscreen, exitFullscreen, fullscreen } = useFullscreenContext();
  const { disable: close, enable: open, enabled } = useToggle();
  const onChangeScreenRatio = useCallback(
    (i: number) => {
      setSelectedRatio(screenRatios[i]);
    },
    [screenRatios, setSelectedRatio],
  );
  const { disable: closeModal, enabled: modalIsActive, toggle: toggleModal } = useToggle();
  const [messageForModalFrame, setMessageForModalFrame] = useState(null);
  const [hideInputListLabel, setHideInputListLabel] = useState(false);

  useEventListener(
    globalThis,
    'keydown',
    useCallback(
      (event) => {
        if (event.key === 'Escape') {
          close();
        }
      },
      [close],
    ),
  );
  const breadcrumbsDiv = document?.querySelector('#breadcrumbsDiv') as HTMLElement;
  const breadcrumbs = document?.querySelector('#breadcrumbs') as HTMLElement;
  const appPreviewDiv = document?.querySelector(`.${styles.previewRoot}`) as HTMLElement;
  const codeEditorTabs = document?.querySelector('#editorTabsDiv') as HTMLElement;
  const guiEditorSwitch = document?.querySelector('#guiEditorSwitch') as HTMLElement;
  const formatSelectionDiv = document?.querySelector(`.${styles.formatSelection}`) as HTMLElement;
  const sideMenu = document?.querySelector('#sideMenu') as HTMLElement;
  const sideMenuWrapper = document?.querySelector('#sideMenuWrapper') as HTMLElement;

  const determineBreadcrumbsVisibility = useCallback(() => {
    if (window?.innerWidth < 1024) {
      if (breadcrumbsDiv.style.getPropertyValue('display') !== 'none') {
        breadcrumbsDiv.style.setProperty('display', 'none', 'important');
      }
    } else {
      breadcrumbsDiv?.style.removeProperty('display');
    }
  }, [breadcrumbsDiv]);

  /* This closes the buttons dropdown menu when a click outside the bounds is registered,
   ** except for the toggle button. */
  useClickOutside(buttonsDropDownRef, close, dropdownBurgerButtonRef);

  const setInputListLabelVisibility = useCallback(() => {
    const totalWidth = breadcrumbsDiv?.clientWidth;
    const breadcrumbsWidth = breadcrumbs?.clientWidth;
    const switchButtonWidth = guiEditorSwitch?.clientWidth;
    const formatSelectionDivWidth = formatSelectionDiv?.clientWidth;
    const freeSpace = totalWidth - (breadcrumbsWidth + switchButtonWidth);
    if (freeSpace < formatSelectionDivWidth) {
      if (!hideInputListLabel) {
        setHideInputListLabel(true);
      }
    } else {
      if (hideInputListLabel && freeSpace >= formatSelectionDivWidth + 127) {
        setHideInputListLabel(false);
      }
    }
  }, [breadcrumbs, breadcrumbsDiv, formatSelectionDiv, guiEditorSwitch, hideInputListLabel]);

  const setAppPreviewSize = useCallback(() => {
    if (selectedRatio && appPreviewDiv) {
      const windowHeight =
        window?.innerHeight ||
        document?.documentElement.clientHeight ||
        document?.body.clientHeight;
      const windowWidth =
        window?.innerWidth || document?.documentElement.clientWidth || document?.body.clientWidth;
      const aspectRatioH =
        windowWidth > windowHeight ? windowWidth / windowHeight : windowHeight / windowWidth;
      const dynamicHeight = (windowWidth / aspectRatioH + windowHeight * 0.7) / 2;

      switch (selectedRatio) {
        case 'phone':
          appPreviewDiv.style.height = `${dynamicHeight - 120.8}px`;
          break;
        case 'tablet':
          appPreviewDiv.style.removeProperty('height');
          appPreviewDiv.style.height = `${dynamicHeight * 0.8}px`;
          break;
        case 'desktop':
          appPreviewDiv.style.removeProperty('height');
          break;
        case 'fill':
          appPreviewDiv.style.height = '100%';
          break;
        default:
          noop();
          break;
      }
    }
  }, [appPreviewDiv, selectedRatio]);

  const closeModalOnDesktop = useCallback(() => {
    if (window?.innerWidth > 1023) {
      closeModal();
    }
  }, [closeModal]);

  setAppPreviewSize();
  determineBreadcrumbsVisibility();

  // Update the app preview size
  useEffect(() => {
    const handleTransitionEnd = (): void => {
      setInputListLabelVisibility();
    };

    const onResize = (): void => {
      setAppPreviewSize();
      setInputListLabelVisibility();
      determineBreadcrumbsVisibility();
      closeModalOnDesktop();
    };

    window.addEventListener('resize', onResize);
    if (window?.innerWidth > 1023) {
      sideMenu?.addEventListener('transitionend', handleTransitionEnd);
      sideMenuWrapper?.addEventListener('transitionend', handleTransitionEnd);
    }
    return (): void => {
      window.removeEventListener('resize', onResize);
      if (window?.innerWidth > 1023) {
        sideMenu?.removeEventListener('transitionend', handleTransitionEnd);
        sideMenuWrapper?.removeEventListener('transitionend', handleTransitionEnd);
      }
    };
  }, [
    closeModalOnDesktop,
    determineBreadcrumbsVisibility,
    setAppPreviewSize,
    setInputListLabelVisibility,
    sideMenu,
    sideMenuWrapper,
  ]);

  // This enables the use of the mouse wheel to scroll the editor's tabs container
  if (codeEditorTabs) {
    codeEditorTabs.addEventListener(
      'wheel',
      (event: WheelEvent) => {
        event.preventDefault();
        codeEditorTabs.scrollLeft += event.deltaY;
      },
      { passive: false },
    );
  }

  useEffect(() => {
    setBreadCrumbsDecoration(
      <Link id="guiEditorSwitch" to={`apps/${id}/edit/gui/pages`}>
        <Button className="button is-fullwidth is-rounded is-transparent is-bordered is-small">
          {`${formatMessage(messages.switchToGuiEditor)} ${formatMessage(messages.experimental)}`}
        </Button>
      </Link>,
    );

    return () => {
      setBreadCrumbsDecoration(null);
    };
  }, [formatMessage, id, lang, location, setBreadCrumbsDecoration]);

  const changeTab = useCallback(
    (event: SyntheticEvent, hash: string) => navigate({ hash }),
    [navigate],
  );

  const handleIframeLoad = (): void => {
    if (modalIsActive && messageForModalFrame) {
      modalFrame?.current.contentWindow.postMessage(
        messageForModalFrame,
        getAppUrl(app.OrganizationId, app.path, app.domain),
      );
    }
  };

  const onSave = useCallback(async () => {
    const definition = parse(appDefinition) as AppDefinition;
    const blockManifests = await getCachedBlockVersions(getAppBlocks(definition));
    // YAML and schema appear to be valid, send it to the app preview iframe
    delete definition.anchors;

    frame.current?.contentWindow.postMessage(
      { type: 'editor/EDIT_SUCCESS', definition, blockManifests, coreStyle, sharedStyle },
      getAppUrl(app.OrganizationId, app.path),
    );
    setMessageForModalFrame({
      type: 'editor/EDIT_SUCCESS',
      definition,
      blockManifests,
      coreStyle,
      sharedStyle,
    });
  }, [app, appDefinition, coreStyle, sharedStyle]);

  useBeforeUnload(appDefinition !== app.yaml);

  const uploadApp = useCallback(async () => {
    try {
      const formData = new FormData();
      formData.append('yaml', appDefinition);
      formData.append('coreStyle', coreStyle);
      formData.append('sharedStyle', sharedStyle);

      const { data } = await axios.patch<App>(`/api/apps/${id}`, formData);
      push({ body: formatMessage(messages.updateSuccess), color: 'success' });

      // Update App State
      setApp(data);
    } catch {
      push(formatMessage(messages.errorUpdate));
    }
  }, [appDefinition, coreStyle, formatMessage, id, push, setApp, sharedStyle]);

  const promptUpdateApp = useConfirmation({
    title: <FormattedMessage {...messages.resourceWarningTitle} />,
    body: <FormattedMessage {...messages.resourceWarning} />,
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: <FormattedMessage {...messages.publish} />,
    action: uploadApp,
    color: 'warning',
  });

  const onUpload = useCallback(async () => {
    const newApp = parse(appDefinition, { maxAliasCount: 10_000 }) as AppDefinition;

    if (!equal(newApp.resources, app.definition.resources)) {
      promptUpdateApp();
      return;
    }

    await uploadApp();
  }, [appDefinition, app, uploadApp, promptUpdateApp]);

  const onMonacoChange = useCallback(
    (event: editor.IModelContentChangedEvent, value: string, model: editor.ITextModel) => {
      switch (String(model.uri)) {
        case 'file:///app.yaml':
          setAppDefinition(value);
          break;
        case 'file:///core.css':
          setCoreStyle(value);
          break;
        case 'file:///shared.css':
          setSharedStyle(value);
          break;
        default:
          break;
      }

      setPristine(false);
    },
    [setCoreStyle, setSharedStyle],
  );

  useEffect(() => {
    const disposable = editor.onDidChangeMarkers((resources) => {
      for (const resource of resources) {
        const { length } = editor.getModelMarkers({ resource });
        switch (String(resource)) {
          case 'file:///app.yaml':
            setAppDefinitionErrorCount(length);
            break;
          case 'file:///core.css':
            setCoreStyleErrorCount(length);
            break;
          case 'file:///shared.css':
            setSharedStyleErrorCount(length);
            break;
          default:
            break;
        }
      }
    });

    return () => disposable.dispose();
  }, []);

  const openShortcuts = useCallback(() => {
    const ed = editorRef.current;
    if (!ed) {
      return;
    }

    const action = ed.getAction('editor.action.quickCommand');
    ed.focus();
    action.run();
  }, []);

  const monacoProps =
    location.hash === '#editor'
      ? { language: 'yaml', uri: 'app.yaml', value: appDefinition }
      : location.hash === '#style-core'
        ? { language: 'css', uri: 'core.css', value: coreStyle }
        : location.hash === '#style-shared'
          ? { language: 'css', uri: 'shared.css', value: sharedStyle }
          : undefined;

  if (!monacoProps) {
    return <Navigate to={{ ...location, hash: '#editor' }} />;
  }

  if (monacoProps.language === 'css' && (coreStyleLoading || sharedStyleLoading)) {
    return <Loader />;
  }

  const disabled = Boolean(
    pristine ||
      app.locked !== 'unlocked' ||
      appDefinitionErrorCount ||
      coreStyleErrorCount ||
      sharedStyleErrorCount,
  );

  function handleButtonClick(handler?: Function): void {
    if (!handler) {
      if (enabled) {
        close();
      }
      return;
    }
    if (enabled) {
      close();
      handler.call(handler);
    } else {
      handler.call(handler);
    }
  }

  return (
    <div
      className={classNames(`${styles.root} is-flex has-background-white`, {
        [String(styles.fullscreen)]: fullscreen.enabled,
      })}
    >
      <div
        className={classNames(`is-flex is-flex-direction-column ${styles.leftPanel}`, {
          [String(styles.fullscreen)]: fullscreen.enabled,
        })}
      >
        <nav
          aria-label="code editor navigation"
          className={classNames('navbar editor-navbar', {
            [String(styles.fullscreen)]: fullscreen.enabled,
          })}
          role="navigation"
        >
          <div className="navbar-brand">
            <button
              aria-expanded="false"
              aria-label="menu"
              className={classNames(['navbar-burger', { 'is-active': enabled }])}
              data-target="navbarMenu"
              onClick={enabled ? close : open}
              ref={dropdownBurgerButtonRef}
              type="button"
            >
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </button>
          </div>
          <div
            className={classNames(['navbar-menu', { 'is-active': enabled }])}
            ref={buttonsDropDownRef}
          >
            <div className="navbar-start">
              <div className="navbar-item px-0">
                <Button
                  className="is-fullwidth mr-2 mb-1"
                  disabled={disabled}
                  icon="vial"
                  onClick={() => handleButtonClick(onSave)}
                >
                  <FormattedMessage {...messages.preview} />
                </Button>
              </div>
              <div className="navbar-item is-hidden-desktop px-0">
                <Button
                  className="is-fullwidth mr-2 mb-1"
                  icon="mobile-screen-button"
                  onClick={() => handleButtonClick(toggleModal)}
                >
                  <FormattedMessage {...messages.openPreview} />
                </Button>
              </div>
              <div className="navbar-item px-0">
                <Button
                  className="is-fullwidth mr-2 mb-1"
                  disabled={disabled}
                  icon="save"
                  onClick={() => handleButtonClick(onUpload)}
                >
                  <FormattedMessage {...messages.publish} />
                </Button>
              </div>
              <div className="navbar-item px-0">
                <Button
                  className="is-fullwidth mr-2 mb-1"
                  component="a"
                  href={getAppUrl(app.OrganizationId, app.path, app.domain)}
                  icon="share-square"
                  onClick={() => handleButtonClick()}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <FormattedMessage {...messages.viewLive} />
                </Button>
              </div>
              <div className="navbar-item px-0">
                <Button
                  className="is-fullwidth mr-2 mb-1"
                  icon="keyboard"
                  onClick={() => handleButtonClick(openShortcuts)}
                >
                  <FormattedMessage {...messages.shortcuts} />
                </Button>
              </div>
              {fullscreen.enabled ? (
                <div className="navbar-item px-0">
                  <Button
                    className="is-fullwidth mr-2 mb-1"
                    icon="compress"
                    iconSize="medium"
                    onClick={() => handleButtonClick(exitFullscreen)}
                  >
                    {String(formatMessage(messages.exitFullscreen))}
                  </Button>
                </div>
              ) : (
                <div className="navbar-item px-0">
                  <Button
                    className="is-fullwidth mr-2 mb-1"
                    icon="expand"
                    iconSize="medium"
                    onClick={() => handleButtonClick(enterFullscreen)}
                  >
                    {String(formatMessage(messages.enterFullscreen))}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </nav>
        <Tabs
          boxed
          className={`${styles.editorTabsDiv} ${fullscreen.enabled ? styles.fullscreen : ''}`}
          id="editorTabsDiv"
          onChange={changeTab}
          value={location?.hash}
        >
          <EditorTab
            className={styles.editorTab}
            errorCount={appDefinitionErrorCount}
            icon="file-code"
            value="#editor"
          >
            <FormattedMessage {...messages.app} />
          </EditorTab>
          <EditorTab
            className={styles.editorTab}
            errorCount={coreStyleErrorCount}
            icon="brush"
            value="#style-core"
          >
            <FormattedMessage {...messages.coreStyle} />
          </EditorTab>
          <EditorTab
            className={styles.editorTab}
            errorCount={sharedStyleErrorCount}
            icon="brush"
            value="#style-shared"
          >
            <FormattedMessage {...messages.sharedStyle} />
          </EditorTab>
        </Tabs>
        <div className={`${styles.editorForm} ${fullscreen.enabled ? styles.fullscreen : ''}`}>
          <MonacoEditor
            className={styles.editor}
            onChange={onMonacoChange}
            onSave={onSave}
            readOnly={app.locked !== 'unlocked'}
            ref={editorRef}
            showDiagnostics
            {...monacoProps}
          />
        </div>
      </div>
      <Prompt message={formatMessage(messages.notification)} when={appDefinition !== app.yaml} />
      <div className={`ml-3 is-hidden-touch ${styles.rightPanel} ${styles[selectedRatio]}`}>
        <div className={styles.formatSelection}>
          <InputList
            hideLabel={hideInputListLabel}
            isRight
            label={String(formatMessage(messages.previewFormat))}
            labelPosition="left"
            onChange={(i: number) => onChangeScreenRatio(i)}
            options={screenRatios}
            value={selectedRatio}
          />
        </div>
        <div className={`${styles.previewRoot} is-flex ml-1 px-5 py-5 ${styles[selectedRatio]}`}>
          <AppPreview app={app} iframeRef={frame} />
        </div>
      </div>
      <Modal
        className={styles.previewModal}
        extraClassName="is-hidden-desktop"
        isActive={modalIsActive}
        onClose={closeModal}
      >
        <div className={`${styles.modalPreviewFrameDiv} is-flex mx-2 px-5 py-5 ${styles.fill}`}>
          <AppPreview app={app} iframeRef={modalFrame} onIframeLoad={handleIframeLoad} />
        </div>
      </Modal>
    </div>
  );
}
