import { Form, Icon, Loader, Modal } from '@appsemble/react-components';
import { normalize, SchemaValidationError, validate, validateStyle } from '@appsemble/utils';
import axios from 'axios';
import classNames from 'classnames';
import yaml from 'js-yaml';
import isEqual from 'lodash.isequal';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import HelmetIntl from '../HelmetIntl';
import MonacoEditor from './components/MonacoEditor';
import styles from './Editor.css';
import messages from './messages';

export default class Editor extends React.Component {
  static propTypes = {
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

  static defaultProps = {
    openApiSpec: null,
  };

  state = {
    appName: '',
    recipe: '',
    style: '',
    sharedStyle: '',
    initialRecipe: '',
    valid: false,
    dirty: true,
    icon: undefined,
    iconURL: undefined,
    warningDialog: false,
    deleteDialog: false,
    organizationId: undefined,
  };

  frame = React.createRef();

  async componentDidMount() {
    const {
      app,
      getOpenApiSpec,
      history,
      match,
      push,
      location,
      intl: { formatMessage },
    } = this.props;
    const { id } = match.params;

    if (!location.hash) {
      history.push('#editor');
    }

    try {
      await getOpenApiSpec();
      // Destructuring path, id and organizationId also hides these technical details for the user
      const { id: dataId, path, organizationId, ...data } = app;
      let { yaml: recipe } = app;

      if (!recipe) {
        recipe = yaml.safeDump({
          ...data,
          ...(normalize(data.name) !== path && { path }),
        });

        push({ body: formatMessage(messages.yamlNotFound), color: 'info' });
      }
      // Include path if the normalized app name does not equal path
      const { data: style } = await axios.get(`/api/apps/${id}/style/core`);
      const { data: sharedStyle } = await axios.get(`/api/apps/${id}/style/shared`);

      this.setState({
        appName: data.name,
        recipe,
        style,
        sharedStyle,
        initialRecipe: recipe,
        path,
        iconURL: `/api/apps/${id}/icon`,
        organizationId,
      });
    } catch (e) {
      if (e.response && (e.response.status === 404 || e.response.status === 401)) {
        push(formatMessage(messages.appNotFound));
      } else {
        push(formatMessage(messages.error));
      }

      history.push('/editor');
    }
  }

  onSave = event => {
    if (event) {
      event.preventDefault();
    }

    this.setState(
      (
        { recipe, style, sharedStyle, organizationId },
        { intl: { formatMessage }, match, openApiSpec, push },
      ) => {
        let app;
        // Attempt to parse the YAML into a JSON object
        try {
          app = yaml.safeLoad(recipe);
          app.organizationId = organizationId;
          app.id = Number(match.params.id);
        } catch (error) {
          push(formatMessage(messages.invalidYaml));
          return { valid: false, dirty: false };
        }
        try {
          validateStyle(style);
          validateStyle(sharedStyle);
        } catch (error) {
          push(formatMessage(messages.invalidStyle));
          return { valid: false, dirty: false };
        }
        validate(openApiSpec.components.schemas.App, app)
          .then(() => {
            this.setState({ valid: true, dirty: false });

            // YAML and schema appear to be valid, send it to the app preview iframe
            this.frame.current.contentWindow.postMessage(
              { type: 'editor/EDIT_SUCCESS', app, style, sharedStyle },
              window.location.origin,
            );
          })
          .catch(error => {
            this.setState(() => {
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

              return { valid: false, dirty: false };
            });
          });
        return null;
      },
    );
  };

  uploadApp = async () => {
    const { intl, match, push, updateApp } = this.props;
    const { recipe, style, sharedStyle, icon, valid, organizationId } = this.state;

    if (!valid) {
      return;
    }

    const { id } = match.params;
    const app = yaml.safeLoad(recipe);
    let { path } = app;

    try {
      const formData = new FormData();
      formData.append('app', JSON.stringify(app));
      // The MIME type for YAML is not officially registered in IANA.
      // For the time being, x-yaml is used. See also: http://www.iana.org/assignments/media-types/media-types.xhtml
      formData.append('yaml', new Blob([recipe], { type: 'text/x-yaml' }));
      formData.append('style', new Blob([style], { type: 'text/css' }));
      formData.append('sharedStyle', new Blob([sharedStyle], { type: 'text/css' }));
      if (icon) {
        formData.append('icon', icon, { type: icon.type });
      }
      ({
        data: { path },
      } = await axios.put(`/api/apps/${id}`, formData));
      push({ body: intl.formatMessage(messages.updateSuccess), color: 'success' });

      // Update Redux state
      updateApp({ ...app, organizationId, id: Number(match.params.id) });
    } catch (e) {
      if (e.response && e.response.status === 403) {
        push(intl.formatMessage(messages.forbidden));
      } else {
        push(intl.formatMessage(messages.errorUpdate));
      }

      return;
    }

    if (icon) {
      try {
        await axios.post(`/api/apps/${id}/icon`, icon, {
          headers: { 'Content-Type': icon.type },
        });
      } catch (e) {
        push(intl.formatMessage(messages.errorUpdateIcon));
      }
    }

    this.setState({
      appName: app.name,
      dirty: true,
      warningDialog: false,
      initialRecipe: recipe,
      path,
    });
  };

  onDelete = async () => {
    const { intl, push, match, history } = this.props;
    const { appName, organizationId } = this.state;
    const { id } = match.params;

    try {
      await axios.delete(`/api/apps/${id}`);
      push({
        body: intl.formatMessage(messages.deleteSuccess, { name: `@${organizationId}/${appName}` }),
        color: 'info',
      });
      history.push('/apps');
    } catch (e) {
      push(intl.formatMessage(messages.errorDelete));
    }
  };

  onDeleteClick = async () => {
    this.setState({ deleteDialog: true });
  };

  onUpload = async () => {
    const { recipe, initialRecipe, valid } = this.state;

    if (valid) {
      const app = yaml.safeLoad(recipe);
      const originalApp = yaml.safeLoad(initialRecipe);

      if (!isEqual(app.resources, originalApp.resources)) {
        this.setState({ warningDialog: true });
        return;
      }

      await this.uploadApp();
    }
  };

  onMonacoChange = value => {
    const {
      location: { hash: tab },
    } = this.props;

    switch (tab) {
      case '#editor':
        this.setState({ recipe: value, dirty: true });
        break;
      case '#style-core':
        this.setState({ style: value, dirty: true });
        break;
      case '#style-shared':
        this.setState({ sharedStyle: value, dirty: true });
        break;
      default:
        break;
    }
  };

  onIconChange = e => {
    const { match } = this.props;
    const { id } = match.params;
    const file = e.target.files[0];

    this.setState({
      icon: file,
      iconURL: file ? URL.createObjectURL(file) : `/api/apps/${id}/icon`,
      dirty: true,
    });
  };

  onClose = () => {
    this.setState({ warningDialog: false, deleteDialog: false });
  };

  render() {
    const {
      appName,
      recipe,
      style,
      sharedStyle,
      path,
      valid,
      dirty,
      icon,
      iconURL,
      warningDialog,
      deleteDialog,
      organizationId,
    } = this.state;
    const {
      intl,
      location: { hash: tab },
    } = this.props;
    const filename = icon ? icon.name : 'Icon';
    const appUrl = `/@${organizationId}/${path}`;

    if (!recipe) {
      return <Loader />;
    }

    const onValueChange = this.onMonacoChange;
    let value;
    let language;

    switch (tab) {
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
          <Form className={styles.editorForm} onSubmit={this.onSave}>
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
                    onClick={this.onUpload}
                    type="button"
                  >
                    <Icon icon="save" />
                    <span>
                      <FormattedMessage {...messages.publish} />
                    </span>
                  </button>
                </span>
                <span className="navbar-item">
                  <div className={classNames('file', icon && 'has-name')}>
                    <label className="file-label" htmlFor="icon-upload">
                      <input
                        accept="image/jpeg, image/png, image/tiff, image/webp, image/xml+svg"
                        className="file-input"
                        id="icon-upload"
                        name="icon"
                        onChange={this.onIconChange}
                        type="file"
                      />
                      <span className="file-cta">
                        <Icon icon="upload" />
                        <span className="file-label">
                          <FormattedMessage {...messages.icon} />
                        </span>
                      </span>
                      {icon && <span className="file-name">{filename}</span>}
                    </label>
                  </div>
                  {iconURL && (
                    <figure className={classNames('image', 'is-32x32', styles.iconPreview)}>
                      <img alt="Icon" src={iconURL} />
                    </figure>
                  )}
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
                  <button className="button is-danger" onClick={this.onDeleteClick} type="button">
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
                <li className={classNames({ 'is-active': tab === '#editor' })} value="editor">
                  <Link to="#editor">
                    <Icon icon="file-code" />
                    <FormattedMessage {...messages.recipe} />
                  </Link>
                </li>
                <li
                  className={classNames({ 'is-active': tab === '#style-core' })}
                  value="style-core"
                >
                  <Link to="#style-core">
                    <Icon icon="brush" />
                    <FormattedMessage {...messages.coreStyle} />
                  </Link>
                </li>
                <li
                  className={classNames({ 'is-active': tab === '#style-shared' })}
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
              className={styles.monacoEditor}
              language={language}
              onSave={this.onSave}
              onValueChange={onValueChange}
              value={value}
            />
            <Modal
              className="is-paddingless"
              isActive={warningDialog}
              onClose={this.onClose}
              title={intl.formatMessage(messages.resourceWarningTitle)}
            >
              <FormattedMessage {...messages.resourceWarning} />
              <footer className="card-footer">
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <a
                  className="card-footer-item is-link"
                  onClick={this.onClose}
                  onKeyDown={this.onKeyDown}
                  role="button"
                  tabIndex="-1"
                >
                  <FormattedMessage {...messages.cancel} />
                </a>
                <button
                  className={classNames(
                    'card-footer-item',
                    'button',
                    'is-warning',
                    styles.cardFooterButton,
                  )}
                  onClick={this.uploadApp}
                  type="button"
                >
                  <div className={styles.dialogContent}>
                    <FormattedMessage {...messages.publish} />
                  </div>
                </button>
              </footer>
            </Modal>
            <Modal
              className="is-paddingless"
              isActive={deleteDialog}
              onClose={this.onClose}
              title={intl.formatMessage(messages.deleteWarningTitle)}
            >
              <div className={styles.dialogContent}>
                <FormattedMessage {...messages.deleteWarning} />
              </div>
              <footer className="card-footer">
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <a
                  className="card-footer-item is-link"
                  onClick={this.onClose}
                  onKeyDown={this.onKeyDown}
                  role="button"
                  tabIndex="-1"
                >
                  <FormattedMessage {...messages.cancel} />
                </a>
                <button
                  className={classNames(
                    'card-footer-item',
                    'button',
                    'is-danger',
                    styles.cardFooterButton,
                  )}
                  onClick={this.onDelete}
                  type="button"
                >
                  <FormattedMessage {...messages.delete} />
                </button>
              </footer>
            </Modal>
          </Form>
        </div>

        <div className={styles.rightPanel}>
          {path && (
            <iframe
              ref={this.frame}
              className={styles.appFrame}
              src={appUrl}
              title={intl.formatMessage(messages.iframeTitle)}
            />
          )}
        </div>
      </div>
    );
  }
}
