import { Form, Icon, Input, Loader, Modal } from '@appsemble/react-components';
import axios from 'axios';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import HelmetIntl from '../HelmetIntl';
import messages from './messages';
import styles from './ResourceTable.css';

export default class ResourceTable extends React.Component {
  static propTypes = {
    app: PropTypes.shape().isRequired,
    match: PropTypes.shape().isRequired,
    history: PropTypes.shape().isRequired,
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
      match: {
        params: { mode, resourceId, resourceName },
      },
    } = this.props;

    if (prevProps.match.params.resourceName !== resourceName) {
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

  onChange = (event, value) => {
    const { name } = event.target;
    if (name === 'id') {
      return;
    }
    this.setState(({ editingResource }, { app, match }) => {
      const { type } = app.definition.resources[match.params.resourceName].schema.properties[name];

      return {
        editingResource: {
          ...editingResource,
          [name]: type === 'object' || type === 'array' ? JSON.parse(value) : value,
        },
      };
    });
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
      push,
      intl: { formatMessage },
      match,
      history,
    } = this.props;
    const { editingResource, resources } = this.state;

    try {
      const { data } = await axios.post(
        `/api/apps/${app.id}/resources/${match.params.resourceName}`,
        editingResource,
      );

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
      push,
      intl: { formatMessage },
      match,
      history,
    } = this.props;
    const { editingResource, resources } = this.state;

    try {
      await axios.put(
        `/api/apps/${app.id}/resources/${match.params.resourceName}/${match.params.resourceId}`,
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
      match,
      push,
      intl: { formatMessage },
    } = this.props;
    const { deletingResource, resources } = this.state;

    try {
      await axios.delete(
        `/api/apps/${app.id}/resources/${match.params.resourceName}/${deletingResource.id}`,
      );
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
    const { app, match } = this.props;
    const { loading } = this.state;
    const { resourceName } = match.params;

    if (!loading) {
      this.setState({ loading: true, error: false, resources: [] });
    }

    if (app.definition.resources[resourceName]?.schema) {
      try {
        const { data: resources } = await axios.get(
          `/api/apps/${app.id}/resources/${resourceName}`,
        );
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
      match: {
        params: { mode, resourceName, resourceId },
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
      if (!app.definition.resources[resourceName]) {
        return (
          <>
            <HelmetIntl
              title={messages.title}
              titleValues={{ name: app.definition.name, resourceName }}
            />
            <FormattedMessage {...messages.notFound} />
          </>
        );
      }

      const { url } = app.definition.resources[resourceName];

      return (
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
      );
    }

    const { schema } = app.definition.resources[resourceName];
    const keys = ['id', ...Object.keys(schema?.properties || {})];

    return (
      <>
        <HelmetIntl
          title={messages.title}
          titleValues={{ name: app.definition.name, resourceName }}
        />
        <h1 className="title">Resource {resourceName}</h1>
        <Link className="button is-primary" to={`${match.url}/new`}>
          <Icon icon="plus-square" />
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
                      <Icon className="has-text-info" icon="pen" size="small" />
                    </Link>
                    <button
                      className="button"
                      onClick={() => this.promptDeleteResource(resource)}
                      type="button"
                    >
                      <Icon className="has-text-danger" icon="trash" size="small" />
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
        <Modal
          className="is-paddingless"
          isActive={mode === 'edit' || mode === 'new'}
          onClose={this.onClose}
          title={
            mode === 'edit' ? (
              <FormattedMessage
                {...messages.editTitle}
                values={{ resource: resourceName, id: resourceId }}
              />
            ) : (
              <FormattedMessage {...messages.newTitle} values={{ resource: resourceName }} />
            )
          }
        >
          <Form onSubmit={mode === 'edit' ? this.submitEdit : this.submitCreate}>
            <div className={styles.dialogContent}>
              {keys.map(key => {
                const properties = schema?.properties[key] || {};
                let value = '';

                if (editingResource && editingResource[key]) {
                  value = editingResource[key];
                  if (typeof value === 'object') {
                    value = JSON.stringify(value);
                  }
                }

                return (
                  <Input
                    key={key}
                    disabled={properties.readOnly || key === 'id'}
                    id={key}
                    label={key}
                    name={key}
                    onChange={this.onChange}
                    placeholder={key}
                    required={schema?.required?.includes(key)}
                    type={properties.format && properties.format === 'email' ? 'email' : 'text'}
                    value={value}
                  />
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
          </Form>
        </Modal>
        <Modal
          className="is-paddingless"
          isActive={warningDialog}
          onClose={this.onClose}
          title={<FormattedMessage {...messages.resourceWarningTitle} />}
        >
          <div className={styles.dialogContent}>
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
        </Modal>
      </>
    );
  }
}
