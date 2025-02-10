import {
  Button,
  Loader,
  Modal,
  Prompt,
  Tabs,
  useBeforeUnload,
  useClickOutside,
  useClosableOnDesktopSideMenu,
  useConfirmation,
  useData,
  useEventListener,
  useMessages,
  useMeta,
  useToggle,
} from '@appsemble/react-components';
import { type App, type AppDefinition } from '@appsemble/types';
import { getAppBlocks, normalize } from '@appsemble/utils';
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
  const toolbarMenuButtonRef = useRef<HTMLButtonElement>();
  const toolbarMenuRef = useRef<HTMLDivElement>();
  const editorRef = useRef<editor.IStandaloneCodeEditor>();
  const { formatMessage } = useIntl();
  const location = useLocation();
  const navigate = useNavigate();
  const push = useMessages();
  const { lang } = useParams();
  const [, setBreadCrumbsDecoration] = useBreadCrumbsDecoration();
  const screenRatios = useMemo(() => ['desktop', 'fill', 'phone', 'tablet'] as const, []);
  const [selectedRatio, setSelectedRatio] = useState<(typeof screenRatios)[number]>('fill');
  const { enterFullscreen, exitFullscreen, fullscreen } = useFullscreenContext();
  const toolbarToggle = useToggle();
  const previewModalToggle = useToggle();
  const [messageForModalFrame, setMessageForModalFrame] = useState(null);

  useClosableOnDesktopSideMenu();

  useEventListener(
    globalThis,
    'keydown',
    useCallback(
      (event) => {
        if (event.key === 'Escape') {
          toolbarToggle.disable();
        }
      },
      [toolbarToggle],
    ),
  );

  /* This closes the buttons dropdown menu when a click outside the bounds is registered,
   ** except for the toggle button. */
  useClickOutside(toolbarMenuRef, toolbarToggle.disable, toolbarMenuButtonRef);

  useEventListener(window, 'resize', () => {
    // If user resizes window from mobile form factor to desktop,
    // close the mobile preview modal
    if (window?.innerWidth > 1023) {
      previewModalToggle.disable();
    }
  });

  const handleToolbarButtonClick = useCallback(
    (handler?: () => unknown) => {
      if (toolbarToggle.enabled) {
        toolbarToggle.disable();
      }
      handler?.call(handler);
    },
    [toolbarToggle],
  );

  useEffect(() => {
    setBreadCrumbsDecoration(
      <Link to={`apps/${id}/${normalize(app.definition.name)}/edit/gui/pages`}>
        <Button
          className={`button is-hidden-touch is-fullwidth is-rounded is-transparent is-bordered is-small ${styles.guiSwitch}`}
        >
          <FormattedMessage {...messages.switchToGuiEditor} />{' '}
          <FormattedMessage {...messages.experimental} />
        </Button>
      </Link>,
    );

    return () => {
      setBreadCrumbsDecoration(null);
    };
  }, [app.definition.name, formatMessage, id, lang, location, setBreadCrumbsDecoration]);

  const changeTab = useCallback(
    (event: SyntheticEvent, hash: string) => navigate({ hash }),
    [navigate],
  );

  const handleIframeLoad = (): void => {
    if (previewModalToggle.enabled && messageForModalFrame) {
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
    modalFrame.current?.contentWindow.postMessage(
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
      setPristine(true);
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

  return (
    <div
      className={classNames(`${styles.root} is-flex has-background-white`, {
        [styles.fullscreen]: fullscreen.enabled,
      })}
    >
      <div
        className={classNames(`is-flex is-flex-direction-column ${styles.leftPanel}`, {
          [styles.fullscreen]: fullscreen.enabled,
        })}
      >
        <nav
          aria-label="code editor navigation"
          className={classNames(`navbar ${styles.editorNavbar}`, {
            [styles.fullscreen]: fullscreen.enabled,
          })}
          role="navigation"
        >
          <div className="navbar-brand">
            <button
              aria-expanded="false"
              aria-label="menu"
              className={classNames(['navbar-burger', { 'is-active': toolbarToggle.enabled }])}
              data-target="navbarMenu"
              onClick={toolbarToggle.enabled ? toolbarToggle.disable : toolbarToggle.enable}
              ref={toolbarMenuButtonRef}
              type="button"
            >
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </button>
          </div>
          <div
            className={classNames([
              'navbar-menu',
              styles.toolbarMenu,
              {
                'is-active': toolbarToggle.enabled,
                [styles.toolbarMenuActive]: toolbarToggle.enabled,
              },
            ])}
            ref={toolbarMenuRef}
          >
            <div className="navbar-start">
              <div className="navbar-item px-0">
                <Button
                  className="is-fullwidth mr-2 mb-1"
                  disabled={disabled}
                  icon="vial"
                  onClick={() => handleToolbarButtonClick(onSave)}
                >
                  <FormattedMessage {...messages.preview} />
                </Button>
              </div>
              <div className="navbar-item is-hidden-desktop px-0">
                <Button
                  className="is-fullwidth mr-2 mb-1"
                  icon="mobile-screen-button"
                  onClick={() => handleToolbarButtonClick(previewModalToggle.toggle)}
                >
                  <FormattedMessage {...messages.openPreview} />
                </Button>
              </div>
              <div className="navbar-item px-0">
                <Button
                  className="is-fullwidth mr-2 mb-1"
                  disabled={disabled}
                  icon="save"
                  onClick={() => handleToolbarButtonClick(onUpload)}
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
                  onClick={() => handleToolbarButtonClick()}
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
                  onClick={() => handleToolbarButtonClick(openShortcuts)}
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
                    onClick={() => handleToolbarButtonClick(exitFullscreen)}
                  >
                    <FormattedMessage {...messages.exitFullscreen} />
                  </Button>
                </div>
              ) : (
                <div className="navbar-item px-0">
                  <Button
                    className="is-fullwidth mr-2 mb-1"
                    icon="expand"
                    iconSize="medium"
                    onClick={() => handleToolbarButtonClick(enterFullscreen)}
                  >
                    <FormattedMessage {...messages.enterFullscreen} />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </nav>
        <Tabs
          boxed
          className={`${styles.editorTabsDiv} ${fullscreen.enabled ? styles.fullscreen : ''}`}
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
      <Prompt message={formatMessage(messages.notification)} when={!pristine} />
      <div className={`ml-3 ${styles.rightPanel} ${styles[selectedRatio]}`}>
        <div className={styles.formatSelection}>
          <InputList
            isRight
            label={formatMessage(messages.previewFormat)}
            labelPosition="left"
            onChange={(i) => setSelectedRatio(screenRatios[i])}
            options={screenRatios}
            value={selectedRatio}
          />
        </div>
        <div className={`${styles.previewRoot} is-flex ml-1 px-5 py-5 ${styles[selectedRatio]}`}>
          <AppPreview app={app} iframeRef={frame} />
        </div>
      </div>
      <Modal
        className={styles.mobilePreviewModal}
        extraClassName="is-hidden-desktop"
        isActive={previewModalToggle.enabled}
        onClose={previewModalToggle.disable}
      >
        <div className={`${styles.mobilePreviewRoot} is-flex mx-2 px-5 py-5 ${styles.fill}`}>
          <AppPreview app={app} iframeRef={modalFrame} onIframeLoad={handleIframeLoad} />
        </div>
      </Modal>
    </div>
  );
}
