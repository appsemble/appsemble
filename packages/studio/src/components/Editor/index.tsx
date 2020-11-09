import RefParser from '@apidevtools/json-schema-ref-parser';
import {
  Form,
  Loader,
  useBeforeUnload,
  useConfirmation,
  useMessages,
} from '@appsemble/react-components';
import { AppDefinition, BlockManifest } from '@appsemble/types';
import {
  api,
  filterBlocks,
  getAppBlocks,
  SchemaValidationError,
  validate,
  validateStyle,
} from '@appsemble/utils';
import axios, { AxiosError } from 'axios';
import { safeDump, safeLoad } from 'js-yaml';
import { isEqual } from 'lodash';
import { editor } from 'monaco-editor';
import { OpenAPIV3 } from 'openapi-types';
import React, { ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useHistory, useLocation, useParams } from 'react-router-dom';

import { getAppUrl } from '../../utils/getAppUrl';
import { useApp } from '../AppContext';
import { GUIEditor } from '../GUIEditor';
import { GuiEditorStep } from '../GUIEditor/types';
import { HelmetIntl } from '../HelmetIntl';
import { MonacoEditor } from '../MonacoEditor';
import { EditorNavBar } from './EditorNavBar';
import styles from './index.css';
import { messages } from './messages';

type Options = editor.IEditorOptions & editor.IGlobalEditorOptions;

const openApiDocumentPromise = RefParser.dereference(api('', { host: window.location.origin }));

const monacoDefaultOptions: Options = {
  insertSpaces: true,
  tabSize: 2,
  minimap: { enabled: false },
  readOnly: false,
};

const monacoGuiOptions: Options = {
  ...monacoDefaultOptions,
  readOnly: true,
};

export function Editor(): ReactElement {
  const { app, setApp } = useApp();

  const [appName, setAppName] = useState('');
  const [recipe, setRecipe] = useState<string>(null);
  const [coreStyle, setCoreStyle] = useState('');
  const [sharedStyle, setSharedStyle] = useState('');
  const [initialRecipe, setInitialRecipe] = useState('');
  const [path, setPath] = useState('');
  const [valid, setValid] = useState(false);
  const [dirty, setDirty] = useState(true);
  const [openApiDocument, setOpenApiDocument] = useState<OpenAPIV3.Document>();

  const [editorStep, setEditorStep] = useState<GuiEditorStep>(GuiEditorStep.YAML);
  const [monacoEditor, setMonacoEditor] = useState<editor.IStandaloneCodeEditor>();
  const [decorationList, setDecorationList] = useState<string[]>([]);

  const frame = useRef<HTMLIFrameElement>();
  const history = useHistory();
  const { formatMessage } = useIntl();
  const location = useLocation();
  const params = useParams<{ id: string }>();
  const push = useMessages();

  useEffect(() => {
    openApiDocumentPromise.then(setOpenApiDocument);
  }, []);

  useEffect(() => {
    const { id } = params;

    if (!location.hash) {
      history.push('#editor');
    }

    const getStyles = async (): Promise<void> => {
      try {
        const { data: coreStyleData } = await axios.get(`/api/apps/${id}/style/core`);
        const { data: sharedStyleData } = await axios.get(`/api/apps/${id}/style/shared`);

        setCoreStyle(coreStyleData);
        setSharedStyle(sharedStyleData);
      } catch (error: unknown) {
        const { response } = error as AxiosError;
        if (response?.status === 404 || response?.status === 401) {
          push(formatMessage(messages.appNotFound));
        } else {
          push(formatMessage(messages.error));
        }
      }
    };

    getStyles();

    // Destructuring path, and organizationId also hides these technical details for the user
    const { definition, path: p } = app;
    let { yaml: yamlRecipe } = app;

    if (!yamlRecipe) {
      yamlRecipe = safeDump(definition);
      push({ body: formatMessage(messages.yamlNotFound), color: 'info' });
    }

    setAppName(definition.name);
    setRecipe(yamlRecipe);
    setInitialRecipe(yamlRecipe);
    setPath(p);
  }, [app, history, formatMessage, location.hash, params, push]);

  const onSave = useCallback(async () => {
    let definition: AppDefinition;
    // Attempt to parse the YAML into a JSON object
    try {
      definition = safeLoad(recipe) as AppDefinition;
    } catch {
      push(formatMessage(messages.invalidYaml));
      setValid(false);
      setDirty(false);
      return;
    }

    try {
      validateStyle(coreStyle);
      validateStyle(sharedStyle);
    } catch {
      push(formatMessage(messages.invalidStyle));
      setValid(false);
      setDirty(false);
      return;
    }

    try {
      await validate(
        (openApiDocument.components.schemas.App as OpenAPIV3.SchemaObject).properties
          .definition as OpenAPIV3.SchemaObject,
        definition,
      );
      const blockManifests: Omit<BlockManifest, 'parameters'>[] = await Promise.all(
        filterBlocks(Object.values(getAppBlocks(definition))).map(async (block) => {
          const { data } = await axios.get<BlockManifest>(
            `/api/blocks/${block.type}/versions/${block.version}`,
          );
          return {
            name: data.name,
            version: data.version,
            layout: data.layout,
            files: data.files,
            actions: data.actions,
          };
        }),
      );
      setValid(true);

      // YAML and schema appear to be valid, send it to the app preview iframe
      delete definition.anchors;
      frame.current.contentWindow.postMessage(
        { type: 'editor/EDIT_SUCCESS', definition, blockManifests, coreStyle, sharedStyle },
        getAppUrl(app.OrganizationId, app.path),
      );
    } catch (error: unknown) {
      if (error instanceof SchemaValidationError) {
        const errors = error.data;
        push({
          body: formatMessage(messages.schemaValidationFailed, {
            properties: Object.keys(errors).join(', '),
          }),
        });
      } else {
        push(formatMessage(messages.unexpected));
      }

      setValid(false);
    }
    setDirty(false);
  }, [app, formatMessage, openApiDocument, push, recipe, sharedStyle, coreStyle]);

  useEffect(() => {
    if (editorStep !== GuiEditorStep.YAML && openApiDocument) {
      onSave();
    }
  }, [recipe, editorStep, onSave, openApiDocument]);

  useBeforeUnload(recipe !== initialRecipe);

  const uploadApp = useCallback(async () => {
    if (!valid) {
      return;
    }

    const { id } = params;
    const definition = safeLoad(recipe) as AppDefinition;

    try {
      const formData = new FormData();
      formData.append('definition', JSON.stringify(definition));
      // The MIME type for YAML is not officially registered in IANA.
      // For the time being, x-yaml is used. See also: http://www.iana.org/assignments/media-types/media-types.xhtml
      formData.append('yaml', new Blob([recipe], { type: 'text/x-yaml' }));
      formData.append('coreStyle', new Blob([coreStyle], { type: 'text/css' }));
      formData.append('sharedStyle', new Blob([sharedStyle], { type: 'text/css' }));

      const { data } = await axios.patch(`/api/apps/${id}`, formData);
      setPath(data.path);
      push({ body: formatMessage(messages.updateSuccess), color: 'success' });

      // Update App State
      setApp(data);
    } catch (error: unknown) {
      if ((error as AxiosError).response?.status === 403) {
        push(formatMessage(messages.forbidden));
      } else {
        push(formatMessage(messages.errorUpdate));
      }

      return;
    }

    setAppName(definition.name);
    setDirty(true);
    setInitialRecipe(recipe);
  }, [formatMessage, params, push, recipe, sharedStyle, coreStyle, setApp, valid]);

  const promptUpdateApp = useConfirmation({
    title: <FormattedMessage {...messages.resourceWarningTitle} />,
    body: <FormattedMessage {...messages.resourceWarning} />,
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: <FormattedMessage {...messages.publish} />,
    action: uploadApp,
    color: 'warning',
  });

  const onUpload = useCallback(async () => {
    if (valid) {
      const newApp = safeLoad(recipe) as AppDefinition;
      const originalApp = safeLoad(initialRecipe) as AppDefinition;

      if (!isEqual(newApp.resources, originalApp.resources)) {
        promptUpdateApp();
        return;
      }

      await uploadApp();
    }
  }, [initialRecipe, promptUpdateApp, recipe, uploadApp, valid]);

  const onMonacoChange = useCallback(
    (_event: editor.IModelContentChangedEvent, value: string) => {
      switch (location.hash) {
        case '#editor':
          setRecipe(value);
          if (editorStep !== GuiEditorStep.YAML) {
            const definition = safeLoad(value) as AppDefinition;
            setApp({ ...app, yaml: value, definition });
          }
          break;
        case '#style-core':
          setCoreStyle(value);
          break;
        case '#style-shared':
          setSharedStyle(value);
          break;
        default:
          break;
      }

      setDirty(true);
    },
    [location.hash, app, editorStep, setApp],
  );

  if (recipe == null) {
    return <Loader />;
  }

  const onValueChange = onMonacoChange;
  let value;
  let language;

  switch (location.hash) {
    case '#style-core':
      value = coreStyle;
      language = 'css';
      break;
    case '#style-shared':
      value = sharedStyle;
      language = 'css';
      break;
    case '#editor':
    default:
      value = recipe;
      language = 'yaml';
  }

  return (
    <div className={`${styles.root} is-flex`}>
      <HelmetIntl title={messages.title} titleValues={{ name: appName }} />
      <div className={styles.leftPanel}>
        <Form onSubmit={onSave}>
          <EditorNavBar
            dirty={dirty}
            editorStep={editorStep}
            onUpload={onUpload}
            setEditorStep={setEditorStep}
            valid={valid}
          />
        </Form>
        {editorStep !== GuiEditorStep.YAML && (
          <GUIEditor
            app={app}
            decorationList={decorationList}
            editorStep={editorStep}
            monacoEditor={monacoEditor}
            onChangeDecorationList={setDecorationList}
            onChangeEditorStep={setEditorStep}
          />
        )}
        <div
          className={
            editorStep === GuiEditorStep.YAML || editorStep === GuiEditorStep.SELECT
              ? styles.editorForm
              : 'is-hidden'
          }
        >
          <MonacoEditor
            decorationList={decorationList}
            language={language}
            onChange={onValueChange}
            onChangeDecorationList={setDecorationList}
            onSave={onSave}
            options={editorStep === GuiEditorStep.YAML ? monacoDefaultOptions : monacoGuiOptions}
            ref={setMonacoEditor}
            value={value}
          />
        </div>
      </div>

      <div className={`${styles.rightPanel} is-flex ml-1 px-5 py-5`}>
        {path && (
          <iframe
            className={styles.appFrame}
            ref={frame}
            src={getAppUrl(app.OrganizationId, app.path)}
            title={formatMessage(messages.iframeTitle)}
          />
        )}
      </div>
    </div>
  );
}
