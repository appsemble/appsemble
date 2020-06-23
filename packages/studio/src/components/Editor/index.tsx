import RefParser from '@apidevtools/json-schema-ref-parser';
import { Form, Loader, useConfirmation, useMessages } from '@appsemble/react-components';
import type { AppDefinition, BlockManifest } from '@appsemble/types';
import {
  api,
  filterBlocks,
  getAppBlocks,
  SchemaValidationError,
  validate,
  validateStyle,
} from '@appsemble/utils';
import axios from 'axios';
import { safeDump, safeLoad } from 'js-yaml';
import { isEqual } from 'lodash';
import type { editor } from 'monaco-editor';
import type { OpenAPIV3 } from 'openapi-types';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useHistory, useLocation, useParams } from 'react-router-dom';

import { useApp } from '../AppContext';
import GUIEditor from '../GUIEditor';
import { GuiEditorStep } from '../GUIEditor/types';
import HelmetIntl from '../HelmetIntl';
import MonacoEditor from '../MonacoEditor';
import EditorNavBar from './components/EditorNavBar';
import styles from './index.css';
import messages from './messages';

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

export default function Editor(): React.ReactElement {
  const { app, setApp } = useApp();

  const [appName, setAppName] = React.useState('');
  const [recipe, setRecipe] = React.useState<string>(null);
  const [style, setStyle] = React.useState('');
  const [sharedStyle, setSharedStyle] = React.useState('');
  const [initialRecipe, setInitialRecipe] = React.useState('');
  const [path, setPath] = React.useState('');
  const [valid, setValid] = React.useState(false);
  const [dirty, setDirty] = React.useState(true);
  const [openApiDocument, setOpenApiDocument] = React.useState<OpenAPIV3.Document>();

  const [editorStep, setEditorStep] = React.useState<GuiEditorStep>(GuiEditorStep.SELECT);
  const [monacoEditor, setMonacoEditor] = React.useState<editor.IStandaloneCodeEditor>();

  const frame = React.useRef<HTMLIFrameElement>();
  const history = useHistory();
  const intl = useIntl();
  const location = useLocation();
  const params = useParams<{ id: string }>();
  const push = useMessages();

  const appUrl = `${window.location.protocol}//${app.path}.${app.OrganizationId}.${window.location.host}`;

  React.useEffect(() => {
    openApiDocumentPromise.then(setOpenApiDocument);
  }, []);

  React.useEffect(() => {
    const { id } = params;

    if (!location.hash) {
      history.push('#editor');
    }

    const getStyles = async (): Promise<void> => {
      try {
        const { data: styleData } = await axios.get(`/api/apps/${id}/style/core`);
        const { data: sharedStyleData } = await axios.get(`/api/apps/${id}/style/shared`);

        setStyle(styleData);
        setSharedStyle(sharedStyleData);
      } catch (error) {
        if (error.response && (error.response.status === 404 || error.response.status === 401)) {
          push(intl.formatMessage(messages.appNotFound));
        } else {
          push(intl.formatMessage(messages.error));
        }
      }
    };

    getStyles();

    // Destructuring path, and organizationId also hides these technical details for the user
    const { definition, path: p } = app;
    let { yaml: yamlRecipe } = app;

    if (!yamlRecipe) {
      yamlRecipe = safeDump(definition);
      push({ body: intl.formatMessage(messages.yamlNotFound), color: 'info' });
    }

    setAppName(definition.name);
    setRecipe(yamlRecipe);
    setInitialRecipe(yamlRecipe);
    setPath(p);
  }, [app, history, intl, location.hash, params, push]);

  const onSave = React.useCallback(async () => {
    let definition: AppDefinition;
    // Attempt to parse the YAML into a JSON object
    try {
      definition = safeLoad(recipe);
    } catch (error) {
      push(intl.formatMessage(messages.invalidYaml));
      setValid(false);
      setDirty(false);
      return;
    }

    try {
      validateStyle(style);
      validateStyle(sharedStyle);
    } catch (error) {
      push(intl.formatMessage(messages.invalidStyle));
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
      frame.current.contentWindow.postMessage(
        { type: 'editor/EDIT_SUCCESS', definition, blockManifests, style, sharedStyle },
        appUrl,
      );
    } catch (error) {
      if (error instanceof SchemaValidationError) {
        const errors = error.data;
        push({
          body: intl.formatMessage(messages.schemaValidationFailed, {
            properties: Object.keys(errors).join(', '),
          }),
        });
      } else {
        push(intl.formatMessage(messages.unexpected));
      }

      setValid(false);
    }
    setDirty(false);
  }, [appUrl, intl, openApiDocument, push, recipe, sharedStyle, style]);

  const uploadApp = React.useCallback(async () => {
    if (!valid) {
      return;
    }

    const { id } = params;
    const definition = safeLoad(recipe);

    try {
      const formData = new FormData();
      formData.append('definition', JSON.stringify(definition));
      // The MIME type for YAML is not officially registered in IANA.
      // For the time being, x-yaml is used. See also: http://www.iana.org/assignments/media-types/media-types.xhtml
      formData.append('yaml', new Blob([recipe], { type: 'text/x-yaml' }));
      formData.append('style', new Blob([style], { type: 'text/css' }));
      formData.append('sharedStyle', new Blob([sharedStyle], { type: 'text/css' }));

      const { data } = await axios.patch(`/api/apps/${id}`, formData);
      setPath(data.path);
      push({ body: intl.formatMessage(messages.updateSuccess), color: 'success' });

      // update App State
      setApp(data);
    } catch (e) {
      if (e.response && e.response.status === 403) {
        push(intl.formatMessage(messages.forbidden));
      } else {
        push(intl.formatMessage(messages.errorUpdate));
      }

      return;
    }

    setAppName(definition.name);
    setDirty(true);
    setInitialRecipe(recipe);
  }, [intl, params, push, recipe, sharedStyle, style, setApp, valid]);

  const promptUpdateApp = useConfirmation({
    title: <FormattedMessage {...messages.resourceWarningTitle} />,
    body: <FormattedMessage {...messages.resourceWarning} />,
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: <FormattedMessage {...messages.publish} />,
    action: uploadApp,
    color: 'warning',
  });

  const onUpload = React.useCallback(async () => {
    if (valid) {
      const newApp = safeLoad(recipe);
      const originalApp = safeLoad(initialRecipe);

      if (!isEqual(newApp.resources, originalApp.resources)) {
        promptUpdateApp();
        return;
      }

      await uploadApp();
    }
  }, [initialRecipe, promptUpdateApp, recipe, uploadApp, valid]);

  const onMonacoChange = React.useCallback(
    (_event: editor.IModelContentChangedEvent, value: string) => {
      switch (location.hash) {
        case '#editor':
          setRecipe(value);
          break;
        case '#style-core':
          setStyle(value);
          break;
        case '#style-shared':
          setSharedStyle(value);
          break;
        default:
          break;
      }

      setDirty(true);
    },
    [location.hash],
  );

  if (recipe == null) {
    return <Loader />;
  }

  const onValueChange = onMonacoChange;
  let value;
  let language;

  switch (location.hash) {
    case '#style-core':
      value = style;
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
    <div className={styles.root}>
      <HelmetIntl title={messages.title} titleValues={{ name: appName }} />
      <div className={styles.leftPanel}>
        <Form onSubmit={onSave}>
          <EditorNavBar
            appUrl={appUrl}
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
            editorStep={editorStep}
            monacoEditor={monacoEditor}
            setEditorStep={setEditorStep}
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
            ref={setMonacoEditor}
            language={language}
            onChange={onValueChange}
            onSave={onSave}
            options={editorStep === GuiEditorStep.YAML ? monacoDefaultOptions : monacoGuiOptions}
            value={value}
          />
        </div>
      </div>

      <div className={styles.rightPanel}>
        {path && (
          <iframe
            ref={frame}
            className={styles.appFrame}
            src={appUrl}
            title={intl.formatMessage(messages.iframeTitle)}
          />
        )}
      </div>
    </div>
  );
}
