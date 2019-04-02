import React from 'react';
import axios from 'axios';
import { Loader } from '@appsemble/react-components';
import classNames from 'classnames';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';

import messages from './messages';
import styles from './ResourceTable.css';

export default class ResourceTable extends React.Component {
  static propTypes = {
    app: PropTypes.shape().isRequired,
    resourceName: PropTypes.string.isRequired,
    push: PropTypes.func.isRequired,
    intl: PropTypes.shape().isRequired,
  };

  state = { resources: [], editingResource: undefined };

  async componentDidMount() {
    const { app, resourceName } = this.props;
    const { data: resources } = await axios.get(`/api/apps/${app.id}/${resourceName}`);

    this.setState({ resources });
  }

  editResource = resource => {
    this.setState({ editingResource: { ...resource } });
  };

  onChange = event => {
    if (event.target.name === 'id') {
      return;
    }
    const { editingResource } = this.state;
    editingResource[event.target.name] = event.target.value;

    this.setState({ editingResource });
  };

  onClose = () => {
    this.setState({ editingResource: undefined });
  };

  onKeyDown = event => {
    if (event.key === 'Escape') {
      this.onClose();
    }
  };

  submitEdit = async event => {
    event.preventDefault();

    const {
      app,
      resourceName,
      push,
      intl: { formatMessage },
    } = this.props;
    const { editingResource, resources } = this.state;

    await axios.put(`/api/apps/${app.id}/${resourceName}/${editingResource.id}`);

    this.setState({
      resources: resources.map(resource =>
        resource.id === editingResource.id ? editingResource : resource,
      ),
      editingResource: null,
    });
    push({ body: formatMessage(messages.updateSuccess), color: 'primary' });
  };

  render() {
    const { app, resourceName } = this.props;
    const { resources, editingResource } = this.state;

    if (!app) {
      return <Loader />;
    }

    const { schema } = app.resources[resourceName];
    const keys = ['id', ...Object.keys(schema.properties)];

    return (
      <React.Fragment>
        <table className="table is-striped is-hoverable is-fullwidth">
          <thead>
            <tr>
              <th>Actions</th>
              {keys.map(property => (
                <th>{property}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resources.map(resource => {
              return (
                <tr>
                  <td className={styles.actionsCell}>
                    <button onClick={() => this.editResource(resource)} type="button">
                      <span className="icon has-text-info">
                        <i className="fas fa-pen" />
                      </span>
                    </button>
                  </td>
                  {keys.map(key => (
                    <td>
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
        <form className="container" onSubmit={this.submitEdit}>
          <div className={classNames('modal', { 'is-active': !!editingResource })}>
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
                    return (
                      <div className="field is-horizontal">
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
                                disabled={schema.properties[key]?.readOnly || key === 'id'}
                                id={key}
                                name={key}
                                onChange={this.onChange}
                                placeholder={key}
                                required={schema.required.includes(key)}
                                value={editingResource ? editingResource[key] : ''}
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
                    className={classNames('card-footer-item', styles.cardFooterButton)}
                    type="submit"
                  >
                    <FormattedMessage {...messages.editButton} />
                  </button>
                </footer>
              </div>
            </div>
            <button className="modal-close is-large" onClick={this.onClose} type="button" />
          </div>
        </form>
      </React.Fragment>
    );
  }
}
