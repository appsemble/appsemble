import {
  Button,
  CardFooterButton,
  Form,
  Icon,
  Loader,
  Modal,
  useMessages,
} from '@appsemble/react-components';
import { AppDefinition, BlockManifest } from '@appsemble/types';
import {
  filterBlocks,
  getAppBlocks,
  SchemaValidationError,
  validate,
  validateStyle,
} from '@appsemble/utils';
import axios from 'axios';
import classNames from 'classnames';
import { safeDump, safeLoad } from 'js-yaml';
import RefParser from 'json-schema-ref-parser';
import { isEqual } from 'lodash';
import { OpenAPIV3 } from 'openapi-types';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useHistory, useLocation, useParams } from 'react-router-dom';

import { useApp } from '../AppContext';
import GUIEditor from '../GUIEditor';
import HelmetIntl from '../HelmetIntl';
import MonacoEditor, { SelectedBlockParent } from '../MonacoEditor';
import styles from './index.css';
import messages from './messages';

export enum GuiEditorStep {
  'YAML',
  'SELECT',
  'ADD',
  'EDIT',
}

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
  const [warningDialog, setWarningDialog] = React.useState(false);
  const [deleteDialog, setDeleteDialog] = React.useState(false);
  const [openApiDocument, setOpenApiDocument] = React.useState<OpenAPIV3.Document>();
  const [editorStep, setEditorStep] = React.useState<GuiEditorStep>(GuiEditorStep.SELECT);

  const [selectedItem, setselectedItem] = React.useState();
  const [selectedBlockParent, setSelectedBlockParent] = React.useState<SelectedBlockParent>();

  const frame = React.useRef<HTMLIFrameElement>();
  const history = useHistory();
  const intl = useIntl();
  const location = useLocation();
  const params = useParams<{ id: string }>();
  const push = useMessages();

  const appUrl = `${window.location.protocol}//${app.path}.${app.OrganizationId}.${window.location.host}`;

  React.useEffect(() => {
    axios
      .get('/api/api.json')
      .then(({ data }) => RefParser.dereference(data))
      .then(setOpenApiDocument);
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

  const onSave = React.useCallback(
    async (event?: React.FormEvent) => {
      if (event) {
        event.preventDefault();
      }

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
          filterBlocks(Object.values(getAppBlocks(definition))).map(async block => {
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
    },
    [appUrl, intl, openApiDocument, push, recipe, sharedStyle, style],
  );

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
    setWarningDialog(false);
    setInitialRecipe(recipe);
  }, [intl, params, push, recipe, sharedStyle, style, setApp, valid]);

  const onDelete = React.useCallback(async () => {
    const { id } = params;

    try {
      await axios.delete(`/api/apps/${id}`);
      push({
        body: intl.formatMessage(messages.deleteSuccess, {
          name: `@${app.OrganizationId}/${appName}`,
        }),
        color: 'info',
      });
      history.push('/apps');
    } catch (e) {
      push(intl.formatMessage(messages.errorDelete));
    }
  }, [app.OrganizationId, appName, history, intl, params, push]);

  // const onDeleteClick = React.useCallback(() => setDeleteDialog(true), []);

  const onUpload = React.useCallback(async () => {
    if (valid) {
      const newApp = safeLoad(recipe);
      const originalApp = safeLoad(initialRecipe);

      if (!isEqual(newApp.resources, originalApp.resources)) {
        setWarningDialog(true);
        return;
      }

      await uploadApp();
    }
  }, [initialRecipe, recipe, uploadApp, valid]);

  const onMonacoChange = React.useCallback(
    value => {
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

  const onClose = React.useCallback(() => {
    setWarningDialog(false);
    setDeleteDialog(false);
  }, []);

  if (recipe == null) {
    return <Loader />;
  }

  const onValueChange = onMonacoChange;
  let value: any;
  let language: any;

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

  function getEditor(): any {
    switch (editorStep) {
      case GuiEditorStep.ADD:
        return <GUIEditor editorStep={editorStep} selectedBlockParent={selectedBlockParent} />;
      case GuiEditorStep.EDIT:
        return <GUIEditor editorStep={editorStep} selectedItem={selectedItem} />;
      case GuiEditorStep.SELECT:
        return (
          <MonacoEditor
            language={language}
            onSave={onSave}
            onValueChange={onValueChange}
            selectedItem={(item: any) => setselectedItem(item)}
            setSelectedBlockParent={(item: SelectedBlockParent) => {
              setSelectedBlockParent(item);
            }}
            value={value}
          />
        );
      default:
        return (
          <MonacoEditor
            language={language}
            onSave={onSave}
            onValueChange={onValueChange}
            value={value}
          />
        );
    }
  }

  return (
    <div className={styles.root}>
      <HelmetIntl title={messages.title} titleValues={{ name: appName }} />
      <div className={styles.leftPanel}>
        <Form className={styles.editorForm} onSubmit={onSave}>
          <nav className="navbar">
            <div className="navbar-brand">
              <span className="navbar-item">
                <Button disabled={!dirty} icon="vial" type="submit">
                  <FormattedMessage {...messages.preview} />
                </Button>
              </span>
              <span className="navbar-item">
                <Button
                  className="button"
                  disabled={!valid || dirty}
                  icon="save"
                  onClick={onUpload}
                >
                  <FormattedMessage {...messages.publish} />
                </Button>
              </span>
              <span className="navbar-item">
                <a className="button" href={appUrl} rel="noopener noreferrer" target="_blank">
                  <Icon icon="share-square" />
                  <span>
                    <FormattedMessage {...messages.viewLive} />
                  </span>
                </a>
              </span>
              {/* <span className="navbar-item">
                <Button color="danger" icon="trash-alt" onClick={onDeleteClick}>
                  <FormattedMessage {...messages.delete} />
                </Button>
              </span> */}
              <span className="navbar-item">
                <Button
                  color="primary"
                  icon="random"
                  onClick={() => {
                    if (editorStep !== GuiEditorStep.YAML) {
                      setEditorStep(GuiEditorStep.YAML);
                    } else {
                      setEditorStep(GuiEditorStep.SELECT);
                    }
                  }}
                >
                  <FormattedMessage {...messages.switchGUI} />
                </Button>
              </span>
            </div>
          </nav>
          <div
            className={
              editorStep === GuiEditorStep.ADD
                ? classNames('is-hidden')
                : classNames('tabs', 'is-boxed', styles.editorTabs)
            }
          >
            {editorStep === GuiEditorStep.YAML ? (
              <ul>
                <li
                  className={classNames({ 'is-active': location.hash === '#editor' })}
                  value="editor"
                >
                  <Link to="#editor">
                    <Icon icon="file-code" />
                    <FormattedMessage {...messages.recipe} />
                  </Link>
                </li>
                <li
                  className={classNames({ 'is-active': location.hash === '#style-core' })}
                  value="style-core"
                >
                  <Link to="#style-core">
                    <Icon icon="brush" />
                    <FormattedMessage {...messages.coreStyle} />
                  </Link>
                </li>
                <li
                  className={classNames({ 'is-active': location.hash === '#style-shared' })}
                  value="style-shared"
                >
                  <Link to="#style-shared">
                    <Icon icon="brush" />
                    <FormattedMessage {...messages.sharedStyle} />
                  </Link>
                </li>
              </ul>
            ) : (
              <ul>
                <li
                  className={classNames({ 'is-active': location.hash === '#editor' })}
                  value="editor"
                >
                  <Link to="#editor">
                    <Icon icon="file-code" />
                    <FormattedMessage {...messages.recipe} />
                  </Link>
                </li>
                <li value="addblock">
                  <Button
                    color="success"
                    disabled={
                      selectedBlockParent !== undefined ? !selectedBlockParent.allowAddBlock : true
                    }
                    icon="plus"
                    onClick={() => setEditorStep(GuiEditorStep.ADD)}
                  >
                    <FormattedMessage {...messages.addBlock} />
                  </Button>
                </li>
                <li value="editblock">
                  <Button
                    color="warning"
                    disabled={
                      selectedBlockParent !== undefined ? !selectedBlockParent.allowAddBlock : true
                    }
                    icon="edit"
                    onClick={() => setEditorStep(GuiEditorStep.EDIT)}
                  >
                    <FormattedMessage {...messages.editBlock} />
                  </Button>
                </li>
                <li value="removeblock">
                  <Button color="danger" icon="trash-alt">
                    <FormattedMessage {...messages.deleteBlock} />
                  </Button>
                </li>
              </ul>
            )}
          </div>
          {getEditor()}
          <Modal
            className="is-paddingless"
            isActive={warningDialog}
            onClose={onClose}
            title={<FormattedMessage {...messages.resourceWarningTitle} />}
          >
            <div className={styles.dialogContent}>
              <FormattedMessage {...messages.resourceWarning} />
            </div>
            <footer className="card-footer">
              <CardFooterButton onClick={onClose}>
                <FormattedMessage {...messages.cancel} />
              </CardFooterButton>
              <CardFooterButton color="warning" onClick={uploadApp}>
                <FormattedMessage {...messages.publish} />
              </CardFooterButton>
            </footer>
          </Modal>
          <Modal
            className="is-paddingless"
            isActive={deleteDialog}
            onClose={onClose}
            title={<FormattedMessage {...messages.deleteWarningTitle} />}
          >
            <div className={styles.dialogContent}>
              <FormattedMessage {...messages.deleteWarning} />
            </div>
            <footer className="card-footer">
              <CardFooterButton onClick={onClose}>
                <FormattedMessage {...messages.cancel} />
              </CardFooterButton>
              <CardFooterButton color="danger" onClick={onDelete}>
                <FormattedMessage {...messages.delete} />
              </CardFooterButton>
            </footer>
          </Modal>
        </Form>
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
