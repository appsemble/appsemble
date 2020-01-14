import { CardFooterButton, Form, Icon, Loader, Modal } from '@appsemble/react-components';
import { SchemaValidationError, validate, validateStyle } from '@appsemble/utils';
import axios from 'axios';
import classNames from 'classnames';
import { safeDump, safeLoad } from 'js-yaml';
import isEqual from 'lodash.isequal';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useHistory, useLocation, useRouteMatch } from 'react-router-dom';

import HelmetIntl from '../HelmetIntl';
import MonacoEditor from '../MonacoEditor';
import styles from './Editor.css';
import messages from './messages';

export default function Editor({ app, getOpenApiSpec, updateApp, openApiSpec, push }) {
  const [appName, setAppName] = React.useState('');
  const [recipe, setRecipe] = React.useState(null);
  const [style, setStyle] = React.useState('');
  const [sharedStyle, setSharedStyle] = React.useState('');
  const [initialRecipe, setInitialRecipe] = React.useState('');
  const [path, setPath] = React.useState('');
  const [valid, setValid] = React.useState(false);
  const [dirty, setDirty] = React.useState(true);
  const [warningDialog, setWarningDialog] = React.useState(false);
  const [deleteDialog, setDeleteDialog] = React.useState(false);

  const frame = React.useRef();
  const history = useHistory();
  const intl = useIntl();
  const location = useLocation();
  const match = useRouteMatch();

  React.useEffect(() => {
    getOpenApiSpec();
  }, [getOpenApiSpec]);

  React.useEffect(() => {
    const { id } = match.params;

    if (!location.hash) {
      history.push('#editor');
    }

    const getStyles = async () => {
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
    const { path: p, definition } = app;
    let { yaml: yamlRecipe } = app;

    if (!yamlRecipe) {
      yamlRecipe = safeDump(definition);
      push({ body: intl.formatMessage(messages.yamlNotFound), color: 'info' });
    }

    setAppName(definition.name);
    setRecipe(yamlRecipe);
    setInitialRecipe(yamlRecipe);
    setPath(p);
  }, [app, getOpenApiSpec, history, intl, location.hash, match.params, push]);

  const onSave = React.useCallback(
    async event => {
      if (event) {
        event.preventDefault();
      }

      const newApp = {};
      // Attempt to parse the YAML into a JSON object
      try {
        newApp.definition = safeLoad(recipe);
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
        await validate(openApiSpec.components.schemas.App, newApp);
        setValid(true);
        setDirty(false);

        // YAML and schema appear to be valid, send it to the app preview iframe
        frame.current.contentWindow.postMessage(
          { type: 'editor/EDIT_SUCCESS', app: newApp, style, sharedStyle },
          window.location.origin,
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
        setDirty(false);
      }
    },
    [intl, openApiSpec, push, recipe, sharedStyle, style],
  );

  const uploadApp = React.useCallback(async () => {
    if (!valid) {
      return;
    }

    const { id } = match.params;
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

      // Update Redux state
      updateApp(data);
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
  }, [intl, match.params, push, recipe, sharedStyle, style, updateApp, valid]);

  const onDelete = React.useCallback(async () => {
    const { id } = match.params;

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
  }, [app.OrganizationId, appName, history, intl, match.params, push]);

  const onDeleteClick = React.useCallback(() => setDeleteDialog(true), []);

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

  const appUrl = `/@${app.OrganizationId}/${path}`;

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
        <Form className={styles.editorForm} onSubmit={onSave}>
          <nav className="navbar">
            <div className="navbar-brand">
              <span className="navbar-item">
                <button className="button" disabled={!dirty} type="submit">
                  <Icon icon="vial" />
                  <span>
                    <FormattedMessage {...messages.preview} />
                  </span>
                </button>
              </span>
              <span className="navbar-item">
                <button
                  className="button"
                  disabled={!valid || dirty}
                  onClick={onUpload}
                  type="button"
                >
                  <Icon icon="save" />
                  <span>
                    <FormattedMessage {...messages.publish} />
                  </span>
                </button>
              </span>
              <span className="navbar-item">
                <a className="button" href={appUrl} rel="noopener noreferrer" target="_blank">
                  <Icon icon="share-square" />
                  <span>
                    <FormattedMessage {...messages.viewLive} />
                  </span>
                </a>
              </span>
              <span className="navbar-item">
                <button className="button is-danger" onClick={onDeleteClick} type="button">
                  <Icon icon="trash-alt" />
                  <span>
                    <FormattedMessage {...messages.delete} />
                  </span>
                </button>
              </span>
            </div>
          </nav>
          <div className={classNames('tabs', 'is-boxed', styles.editorTabs)}>
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
          </div>
          <MonacoEditor
            language={language}
            onSave={onSave}
            onValueChange={onValueChange}
            value={value}
          />
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

Editor.propTypes = {
  app: PropTypes.shape().isRequired,
  getOpenApiSpec: PropTypes.func.isRequired,
  updateApp: PropTypes.func.isRequired,
  history: PropTypes.shape().isRequired,
  intl: PropTypes.shape().isRequired,
  location: PropTypes.shape().isRequired,
  match: PropTypes.shape().isRequired,
  openApiSpec: PropTypes.shape(),
  push: PropTypes.func.isRequired,
};

Editor.defaultProps = {
  openApiSpec: null,
};
