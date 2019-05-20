import classNames from 'classnames';
import { Loader, Modal } from '@appsemble/react-components';
import axios from 'axios';
import isEqual from 'lodash.isequal';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import React from 'react';
import yaml from 'js-yaml';
import validate, { SchemaValidationError } from '@appsemble/utils/validate';
import validateStyle from '@appsemble/utils/validateStyle';
import normalize from '@appsemble/utils/normalize';

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
    recipe: '',
    style: '',
    sharedStyle: '',
    initialRecipe: '',
    valid: false,
    dirty: true,
    icon: undefined,
    iconURL: undefined,
    warningDialog: false,
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
        // eslint-disable-next-line react/prop-types
        validate(openApiSpec.components.schemas.App, app)
          .then(() => {
            this.setState({ valid: true, dirty: false });

            // YAML and schema appear to be valid, send it to the app preview iframe
            // eslint-disable-next-line react/prop-types
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

    this.setState({ dirty: true, warningDialog: false, initialRecipe: recipe, path });
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
    this.setState({ warningDialog: false });
  };

  render() {
    const {
      recipe,
      style,
      sharedStyle,
      path,
      valid,
      dirty,
      icon,
      iconURL,
      warningDialog,
    } = this.state;
    const {
      intl,
      location: { hash: tab },
    } = this.props;
    const filename = icon ? icon.name : 'Icon';

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
        <div className={styles.leftPanel}>
          <form className={styles.editorForm} onSubmit={this.onSave}>
            <nav className="navbar">
              <div className="navbar-brand">
                <span className="navbar-item">
                  <button className="button" disabled={!dirty} type="submit">
                    <FormattedMessage {...messages.preview} />
                  </button>
                </span>
                <span className="navbar-item">
                  <button
                    className="button"
                    disabled={!valid || dirty}
                    onClick={this.onUpload}
                    type="button"
                  >
                    <FormattedMessage {...messages.publish} />
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
                        <span className="file-icon">
                          <i className="fas fa-upload" />
                        </span>
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
                  <a className="button" href={`/${path}`} rel="noopener noreferrer" target="_blank">
                    <FormattedMessage {...messages.viewLive} />
                  </a>
                </span>
              </div>
            </nav>
            <div className={classNames('tabs', 'is-boxed', styles.editorTabs)}>
              <ul>
                <li className={classNames({ 'is-active': tab === '#editor' })} value="editor">
                  <Link to="#editor">
                    <span className="icon">
                      <i className="fas fa-file-code" />
                    </span>
                    <FormattedMessage {...messages.recipe} />
                  </Link>
                </li>
                <li
                  className={classNames({ 'is-active': tab === '#style-core' })}
                  value="style-core"
                >
                  <Link to="#style-core">
                    <span className="icon">
                      <i className="fas fa-brush" />
                    </span>
                    <FormattedMessage {...messages.coreStyle} />
                  </Link>
                </li>
                <li
                  className={classNames({ 'is-active': tab === '#style-shared' })}
                  value="style-shared"
                >
                  <Link to="#style-shared">
                    <span className="icon">
                      <i className="fas fa-brush" />
                    </span>
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
            <Modal isActive={warningDialog} onClose={this.onClose}>
              <div className="card">
                <header className="card-header">
                  <p className="card-header-title">
                    <FormattedMessage {...messages.resourceWarningTitle} />
                  </p>
                </header>
                <div className="card-content">
                  <FormattedMessage {...messages.resourceWarning} />
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
                      'is-warning',
                      styles.cardFooterButton,
                    )}
                    onClick={this.uploadApp}
                    type="button"
                  >
                    <FormattedMessage {...messages.publish} />
                  </button>
                </footer>
              </div>
            </Modal>
          </form>
        </div>

        <div className={styles.rightPanel}>
          {path && (
            <iframe
              ref={this.frame}
              className={styles.appFrame}
              src={`/${path}`}
              title={intl.formatMessage(messages.iframeTitle)}
            />
          )}
        </div>
      </div>
    );
  }
}
