import {
  Button,
  Prompt,
  Tabs,
  useBeforeUnload,
  useConfirmation,
  useData,
  useMessages,
  useMeta,
} from '@appsemble/react-components';
import { type App, type AppDefinition } from '@appsemble/types';
import { getAppBlocks } from '@appsemble/utils';
import axios from 'axios';
import equal from 'fast-deep-equal';
import { editor } from 'monaco-editor/esm/vs/editor/editor.api.js';
import {
  type ReactElement,
  type SyntheticEvent,
  useCallback,
  useEffect,
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
import { getCachedBlockVersions } from '../../../../components/MonacoEditor/appValidation/index.js';
import { MonacoEditor } from '../../../../components/MonacoEditor/index.js';
import { getAppUrl } from '../../../../utils/getAppUrl.js';
import { useApp } from '../index.js';

export default function EditPage(): ReactElement {
  useMeta(messages.title);

  const { app, setApp } = useApp();
  const { id } = app;

  const [appDefinition, setAppDefinition] = useState<string>(app.yaml);
  const { data: coreStyle, setData: setCoreStyle } = useData<string>(`/api/apps/${id}/style/core`);
  const { data: sharedStyle, setData: setSharedStyle } = useData<string>(
    `/api/apps/${id}/style/shared`,
  );

  const [appDefinitionErrorCount, setAppDefinitionErrorCount] = useState(0);
  const [coreStyleErrorCount, setCoreStyleErrorCount] = useState(0);
  const [sharedStyleErrorCount, setSharedStyleErrorCount] = useState(0);

  const [pristine, setPristine] = useState(true);

  const frame = useRef<HTMLIFrameElement>();
  const editorRef = useRef<editor.IStandaloneCodeEditor>();
  const { formatMessage } = useIntl();
  const location = useLocation();
  const navigate = useNavigate();
  const push = useMessages();
  const { lang } = useParams();

  const [, setBreadCrumbsDecoration] = useBreadCrumbsDecoration();

  useEffect(() => {
    setBreadCrumbsDecoration(
      <Link className="my-2 mx-1" to={`/${lang}/apps/${id}/edit/gui`}>
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

  const onSave = useCallback(async () => {
    const definition = parse(appDefinition) as AppDefinition;
    const blockManifests = await getCachedBlockVersions(getAppBlocks(definition));
    // YAML and schema appear to be valid, send it to the app preview iframe
    delete definition.anchors;
    frame.current?.contentWindow.postMessage(
      { type: 'editor/EDIT_SUCCESS', definition, blockManifests, coreStyle, sharedStyle },
      getAppUrl(app.OrganizationId, app.path),
    );
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

  const disabled = Boolean(
    pristine ||
      app.locked ||
      appDefinitionErrorCount ||
      coreStyleErrorCount ||
      sharedStyleErrorCount,
  );

  return (
    <div className={`${styles.root} is-flex`}>
      <div className={`is-flex is-flex-direction-column ${styles.leftPanel}`}>
        <div className="buttons">
          <Button disabled={disabled} icon="vial" onClick={onSave}>
            <FormattedMessage {...messages.preview} />
          </Button>
          <Button disabled={disabled} icon="save" onClick={onUpload}>
            <FormattedMessage {...messages.publish} />
          </Button>
          <Button
            component="a"
            href={getAppUrl(app.OrganizationId, app.path, app.domain)}
            icon="share-square"
            rel="noopener noreferrer"
            target="_blank"
          >
            <FormattedMessage {...messages.viewLive} />
          </Button>
          <Button icon="keyboard" onClick={openShortcuts}>
            <FormattedMessage {...messages.shortcuts} />
          </Button>
        </div>
        <Tabs boxed className="mb-0" onChange={changeTab} value={location.hash}>
          <EditorTab errorCount={appDefinitionErrorCount} icon="file-code" value="#editor">
            <FormattedMessage {...messages.app} />
          </EditorTab>
          <EditorTab errorCount={coreStyleErrorCount} icon="brush" value="#style-core">
            <FormattedMessage {...messages.coreStyle} />
          </EditorTab>
          <EditorTab errorCount={sharedStyleErrorCount} icon="brush" value="#style-shared">
            <FormattedMessage {...messages.sharedStyle} />
          </EditorTab>
        </Tabs>
        <div className={styles.editorForm}>
          <MonacoEditor
            className={styles.editor}
            onChange={onMonacoChange}
            onSave={onSave}
            readOnly={app.locked}
            ref={editorRef}
            showDiagnostics
            {...monacoProps}
          />
        </div>
      </div>
      <Prompt message={formatMessage(messages.notification)} when={appDefinition !== app.yaml} />
      <div className={`${styles.previewRoot} is-flex ml-1 px-5 py-5`}>
        <AppPreview app={app} iframeRef={frame} />
      </div>
    </div>
  );
}
