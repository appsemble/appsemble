import classNames from 'classnames';
import { Loader } from '@appsemble/react-components';
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
    history: PropTypes.shape().isRequired,
    intl: PropTypes.shape().isRequired,
    location: PropTypes.shape().isRequired,
    match: PropTypes.shape().isRequired,
    push: PropTypes.func.isRequired,
  };

  state = {
    // eslint-disable-next-line react/no-unused-state
    appSchema: {},
    recipe: '',
    style: '',
    sharedStyle: '',
    initialRecipe: '',
    valid: false,
    dirty: true,
    icon: undefined,
    iconURL: undefined,
    warningDialog: false,
    // eslint-disable-next-line react/no-unused-state
    organizationId: undefined,
  };

  frame = React.createRef();

  async componentDidMount() {
    const {
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

    const {
      data: {
        definitions: { App: appSchema },
      },
    } = await axios.get('/api.json');

    try {
      const request = await axios.get(`/api/apps/${id}`);
      // Destructuring path, id and organizationId also hides these technical details for the user
      const {
        data: { id: dataId, path, organizationId, ...data },
      } = request;
      // Include path if the normalized app name does not equal path
      const recipe = yaml.safeDump({
        ...data,
        ...(normalize(data.name) !== path && { path }),
      });
      const { data: style } = await axios.get(`/api/apps/${id}/style/core`);
      const { data: sharedStyle } = await axios.get(`/api/apps/${id}/style/shared`);

      this.setState({
        // eslint-disable-next-line react/no-unused-state
        appSchema,
        recipe,
        style,
        sharedStyle,
        initialRecipe: recipe,
        path,
        iconURL: `/api/apps/${id}/icon`,
        // eslint-disable-next-line react/no-unused-state
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
        { appSchema, recipe, style, sharedStyle, organizationId },
        { intl: { formatMessage }, match, push },
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
        validate(appSchema, app)
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
    const { intl, match, push } = this.props;
    const { recipe, style, sharedStyle, icon, valid } = this.state;

    if (!valid) {
      return;
    }

    const { id } = match.params;
    const app = yaml.safeLoad(recipe);
    let { path } = app;

    try {
      const formData = new FormData();
      formData.append('app', JSON.stringify(app));
      formData.append('style', new Blob([style], { type: 'text/css' }));
      formData.append('sharedStyle', new Blob([sharedStyle], { type: 'text/css' }));
      ({
        data: { path },
      } = await axios.put(`/api/apps/${id}`, formData));
      push({ body: intl.formatMessage(messages.updateSuccess), color: 'success' });
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

  onKeyDown = event => {
    if (event.key === 'Escape') {
      this.onClose();
    }
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
                    Save
                  </button>
                </span>
                <span className="navbar-item">
                  <button
                    className="button"
                    disabled={!valid || dirty}
                    onClick={this.onUpload}
                    type="button"
                  >
                    Upload
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
                        <span className="file-label">Icon</span>
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
                    View live
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
                    Recipe
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
                    Core Style
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
                    Shared Style
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
            <div className={classNames('modal', warningDialog && 'is-active')}>
              <div
                className="modal-background"
                onClick={this.onClose}
                onKeyDown={this.onKeyDown}
                role="presentation"
              />
              <div className="modal-content">
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
                      <FormattedMessage {...messages.upload} />
                    </button>
                  </footer>
                </div>
              </div>
              <button className="modal-close is-large" onClick={this.onClose} type="button" />
            </div>
          </form>
        </div>

        <div className={styles.rightPanel}>
          {path && (
            <iframe
              ref={this.frame}
              className={styles.appFrame}
              src={`/${path}`}
              title="Appsemble App Preview"
            />
          )}
        </div>
      </div>
    );
  }
}
