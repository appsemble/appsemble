import React from 'react';
import axios from 'axios';
import { Loader } from '@appsemble/react-components';
import classNames from 'classnames';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import messages from './messages';
import styles from './ResourceTable.css';

export default class ResourceTable extends React.Component {
  static propTypes = {
    app: PropTypes.shape().isRequired,
    match: PropTypes.shape().isRequired,
    history: PropTypes.shape().isRequired,
    resourceName: PropTypes.string.isRequired,
    push: PropTypes.func.isRequired,
    intl: PropTypes.shape().isRequired,
  };

  state = {
    resources: undefined,
    deletingResource: undefined,
    editingResource: undefined,
    loading: true,
    error: false,
    warningDialog: false,
  };

  async componentDidMount() {
    const {
      match: {
        params: { mode, resourceId },
      },
    } = this.props;

    await this.loadResource();

    if (mode === 'edit') {
      const { resources } = this.state;

      this.setState({
        editingResource: resources.find(resource => resource.id === Number(resourceId)),
      });
    }

    if (mode === 'new') {
      this.setState({ editingResource: {} });
    }
  }

  async componentDidUpdate(prevProps) {
    const {
      resourceName,
      match: {
        params: { mode, resourceId },
      },
    } = this.props;

    if (prevProps.resourceName !== resourceName) {
      await this.loadResource();
    }

    if (!prevProps.match.params.mode && mode === 'edit') {
      const { resources } = this.state;
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({
        editingResource: resources.find(resource => resource.id === Number(resourceId)),
      });
    }

    if (!prevProps.match.params.mode && mode === 'new') {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ editingResource: {} });
    }
  }

  onChange = event => {
    if (event.target.name === 'id') {
      return;
    }

    const { editingResource } = this.state;
    editingResource[event.target.name] = event.target.value;

    this.setState({ editingResource });
  };

  onClose = () => {
    const { match, history } = this.props;
    history.push(
      match.url.replace(
        `/${match.params.mode}${match.params.mode === 'edit' ? `/${match.params.resourceId}` : ''}`,
        '',
      ),
    );

    this.setState({ editingResource: undefined, warningDialog: false });
  };

  onKeyDown = event => {
    if (event.key === 'Escape') {
      this.onClose();
    }
  };

  submitCreate = async event => {
    event.preventDefault();

    const {
      app,
      resourceName,
      push,
      intl: { formatMessage },
      match,
      history,
    } = this.props;
    const { editingResource, resources } = this.state;

    try {
      const { data } = await axios.post(`/api/apps/${app.id}/${resourceName}`, editingResource);

      this.setState({
        resources: [...resources, data],
        editingResource: null,
      });

      history.push(match.url.replace(`/${match.params.mode}`, ''));

      push({ body: formatMessage(messages.createSuccess, { id: data.id }), color: 'primary' });
    } catch (e) {
      push(formatMessage(messages.createError));
    }
  };

  submitEdit = async event => {
    event.preventDefault();

    const {
      app,
      resourceName,
      push,
      intl: { formatMessage },
      match,
      history,
    } = this.props;
    const { editingResource, resources } = this.state;

    try {
      await axios.put(
        `/api/apps/${app.id}/${resourceName}/${match.params.resourceId}`,
        editingResource,
      );

      this.setState({
        resources: resources.map(resource =>
          resource.id === match.params.resourceId ? editingResource : resource,
        ),
        editingResource: null,
      });

      history.push(match.url.replace(`/${match.params.mode}/${match.params.resourceId}`, ''));

      push({ body: formatMessage(messages.updateSuccess), color: 'primary' });
    } catch (e) {
      push(formatMessage(messages.updateError));
    }
  };

  promptDeleteResource = resource => {
    this.setState({ warningDialog: true, deletingResource: resource });
  };

  deleteResource = async () => {
    const {
      app,
      resourceName,
      push,
      intl: { formatMessage },
    } = this.props;
    const { deletingResource, resources } = this.state;

    try {
      await axios.delete(`/api/apps/${app.id}/${resourceName}/${deletingResource.id}`);
      push({
        body: formatMessage(messages.deleteSuccess, { id: deletingResource.id }),
        color: 'primary',
      });
      this.setState({
        resources: resources.filter(resource => resource.id !== deletingResource.id),
        deletingResource: undefined,
        warningDialog: false,
      });
    } catch (e) {
      push(formatMessage(messages.deleteError));
    }
  };

  async loadResource() {
    const { app, resourceName } = this.props;
    const { loading } = this.state;

    if (!loading) {
      this.setState({ loading: true, error: false, resources: [] });
    }

    if (app.schema) {
      try {
        const { data: resources } = await axios.get(`/api/apps/${app.id}/${resourceName}`);
        this.setState({ resources, loading: false });
      } catch (e) {
        this.setState({ loading: false, error: true });
      }
    } else {
      this.setState({ loading: false, resources: undefined });
    }
  }

  render() {
    const {
      app,
      resourceName,
      match: {
        params: { mode },
        ...match
      },
    } = this.props;
    const { resources, editingResource, loading, error, warningDialog } = this.state;

    if (!app || loading) {
      return <Loader />;
    }

    if (error) {
      return <FormattedMessage {...messages.loadError} />;
    }

    if (!loading && resources === undefined) {
      const { url } = app.resources[resourceName];
      return (
        <React.Fragment>
          <FormattedMessage
            {...messages.notManaged}
            values={{
              link: (
                <a href={url} rel="noopener noreferrer" target="_blank">
                  {url}
                </a>
              ),
            }}
          />
        </React.Fragment>
      );
    }

    const { schema } = app.resources[resourceName];
    const keys = ['id', ...Object.keys(schema.properties)];

    return (
      <React.Fragment>
        <h1 className="title">Resource {resourceName}</h1>
        <Link className="button is-primary" to={`${match.url}/new`}>
          <span className="icon">
            <i className="fas fa-plus-square" />
          </span>
          <span>
            <FormattedMessage {...messages.createButton} />
          </span>
        </Link>
        <table className="table is-striped is-hoverable is-fullwidth">
          <thead>
            <tr>
              <th>Actions</th>
              {keys.map(property => (
                <th key={property}>{property}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resources.map(resource => {
              return (
                <tr key={resource.id}>
                  <td className={styles.actionsCell}>
                    <Link className="button" to={`${match.url}/edit/${resource.id}`}>
                      <span className="icon is-small has-text-info">
                        <i className="fas fa-pen" />
                      </span>
                    </Link>
                    <button
                      className="button"
                      onClick={() => this.promptDeleteResource(resource)}
                      type="button"
                    >
                      <span className="icon is-small has-text-danger">
                        <i className="fas fa-trash" />
                      </span>
                    </button>
                  </td>
                  {keys.map(key => (
                    <td key={key} className={styles.contentCell}>
                      {typeof resource[key] === 'string'
                        ? resource[key]
                        : JSON.stringify(resource[key])}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        <form
          className="container"
          onSubmit={mode === 'edit' ? this.submitEdit : this.submitCreate}
        >
          <div className={classNames('modal', { 'is-active': mode === 'edit' || mode === 'new' })}>
            <div
              className="modal-background"
              onClick={this.onClose}
              onKeyDown={this.onKeyDown}
              role="presentation"
            />
            <div className="modal-content">
              <div className="card">
                <div className="card-content">
                  {keys.map(key => {
                    const properties = schema.properties[key] || {};

                    return (
                      <div key={key} className="field is-horizontal">
                        <div className="field-label is-normal">
                          <label className="label" htmlFor={key}>
                            {key}
                          </label>
                        </div>
                        <div className="field-body">
                          <div className="field">
                            <div className="control">
                              <input
                                className="input"
                                disabled={properties.readOnly || key === 'id'}
                                id={key}
                                name={key}
                                onChange={this.onChange}
                                placeholder={key}
                                required={schema.required.includes(key)}
                                type={
                                  properties.format && properties.format === 'email'
                                    ? 'email'
                                    : 'text'
                                }
                                value={
                                  editingResource && editingResource[key]
                                    ? editingResource[key]
                                    : ''
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <footer className="card-footer">
                  {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                  <a
                    className="card-footer-item is-link"
                    onClick={this.onClose}
                    onKeyDown={this.onKeyDown}
                    role="button"
                    tabIndex="0"
                  >
                    <FormattedMessage {...messages.cancelButton} />
                  </a>
                  <button
                    className={classNames(
                      'card-footer-item',
                      'button',
                      'is-primary',
                      styles.cardFooterButton,
                    )}
                    type="submit"
                  >
                    {mode === 'edit' ? (
                      <FormattedMessage {...messages.editButton} />
                    ) : (
                      <FormattedMessage {...messages.createButton} />
                    )}
                  </button>
                </footer>
              </div>
            </div>
            <button className="modal-close is-large" onClick={this.onClose} type="button" />
          </div>
        </form>
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
                  <FormattedMessage {...messages.cancelButton} />
                </a>
                <button
                  className={classNames(
                    'card-footer-item',
                    'button',
                    'is-danger',
                    styles.cardFooterButton,
                  )}
                  onClick={this.deleteResource}
                  type="button"
                >
                  <FormattedMessage {...messages.deleteButton} />
                </button>
              </footer>
            </div>
          </div>
          <button className="modal-close is-large" onClick={this.onClose} type="button" />
        </div>
      </React.Fragment>
    );
  }
}
