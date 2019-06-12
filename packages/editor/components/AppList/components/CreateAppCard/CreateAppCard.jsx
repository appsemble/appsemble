import { Form, Modal } from '@appsemble/react-components';
import axios from 'axios';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './CreateAppCard.css';
import messages from './messages';

export default class CreateAppCard extends React.Component {
  static propTypes = {
    createTemplateApp: PropTypes.func.isRequired,
    history: PropTypes.shape().isRequired,
    intl: PropTypes.shape().isRequired,
    match: PropTypes.shape().isRequired,
    push: PropTypes.func.isRequired,
    user: PropTypes.shape().isRequired,
  };

  state = {
    modalOpen: false,
    selectedTemplate: 0,
    selectedOrganization: 0,
    appName: '',
    appDescription: '',
    templates: [],
    loading: true,
    includeResources: false,
  };

  async componentDidMount() {
    const { data: templates } = await axios.get('/api/templates');
    this.setState({ templates, loading: false });
  }

  onChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  };

  onCheckboxChange = event => {
    this.setState({ [event.target.name]: event.target.checked });
  };

  onClick = () => {
    this.setState({ modalOpen: true });
  };

  onClose = () => {
    this.setState({ modalOpen: false });
  };

  onCreate = async event => {
    event.preventDefault();

    const {
      createTemplateApp,
      history,
      push,
      match,
      intl: { formatMessage },
      user,
    } = this.props;
    const {
      appName,
      appDescription,
      selectedTemplate,
      selectedOrganization,
      templates,
      includeResources,
    } = this.state;

    try {
      const { name, resources } = templates[selectedTemplate];
      const app = await createTemplateApp(
        {
          template: name,
          name: appName,
          description: appDescription,
          resources: resources && includeResources,
        },
        user.organizations[selectedOrganization],
      );

      history.push(`${match.url}/${app.id}/edit`);
    } catch (e) {
      if (e.response) {
        if (e.response.status === 409) {
          push({ body: formatMessage(messages.nameConflict, { name: appName }) });
        }

        if (e.response.data.message === 'Unknown blocks or block versions found') {
          const blocks = Array.from(new Set(Object.values(e.response.data.data)));

          push({
            body: formatMessage(messages.missingBlocks, { blockCount: blocks.length, blocks }),
          });
        }
      } else {
        push({ body: formatMessage(messages.error) });
      }
    }
  };

  render() {
    const {
      intl: { formatMessage },
      user,
    } = this.props;
    const {
      modalOpen,
      selectedTemplate,
      selectedOrganization,
      appName,
      appDescription,
      templates,
      loading,
      includeResources,
    } = this.state;

    if (loading) {
      return null;
    }

    return (
      <div className={styles.createAppCardContainer}>
        <div
          className={classNames('card', styles.createAppCard)}
          onClick={this.onClick}
          onKeyDown={this.onKeyDown}
          role="button"
          tabIndex="0"
        >
          <div className="card-content">
            <FormattedMessage {...messages.createApp} />
          </div>
        </div>
        <Modal isActive={modalOpen} onClose={this.onClose}>
          <Form className="card" onSubmit={this.onCreate}>
            <header className="card-header">
              <div className="card-header-title">
                <FormattedMessage {...messages.createAppTitle} />
              </div>
            </header>
            <div className="card-content">
              <div className="field is-horizontal">
                <div className="field-label is-normal">
                  <label className="label" htmlFor="inputAppName">
                    <FormattedMessage {...messages.name} />
                  </label>
                </div>
                <div className="field-body">
                  <div className="field">
                    <div className="control">
                      <input
                        className="input"
                        id="inputAppName"
                        maxLength={30}
                        minLength={1}
                        name="appName"
                        onChange={this.onChange}
                        placeholder={formatMessage(messages.name)}
                        required
                        value={appName}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="field is-horizontal">
                <div className="field-label is-normal">
                  <label className="label" htmlFor="inputSelectedOrganization">
                    <FormattedMessage {...messages.organization} />
                  </label>
                </div>
                <div className="field-body">
                  <div className="field">
                    <div className="control">
                      <div className="select">
                        <select
                          disabled={user.organizations.length === 1}
                          id="inputSelectedOrganization"
                          name="selectedOrganization"
                          onChange={this.onChange}
                          value={selectedOrganization}
                        >
                          {user.organizations.map((organization, index) => (
                            <option key={organization.id} value={index}>
                              {organization.id}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="field is-horizontal">
                <div className="field-label is-normal">
                  <label className="label" htmlFor="inputAppDescription">
                    <FormattedMessage {...messages.description} />
                  </label>
                </div>
                <div className="field-body">
                  <div className="field">
                    <div className="control">
                      <textarea
                        className="textarea"
                        id="inputAppDescription"
                        maxLength={80}
                        name="appDescription"
                        onChange={this.onChange}
                        placeholder={formatMessage(messages.description)}
                        value={appDescription}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="field is-horizontal">
                <div className="field-label is-normal">
                  <label className="label" htmlFor="inputSelectedTemplate">
                    <FormattedMessage {...messages.template} />
                  </label>
                </div>
                <div className="field-body">
                  <div className="field">
                    <div className="control">
                      <div className="select">
                        <select
                          id="inputSelectedTemplate"
                          name="selectedTemplate"
                          onChange={this.onChange}
                          value={selectedTemplate}
                        >
                          {templates.map((template, index) => (
                            <option key={template.name} value={index}>
                              {template.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <article className="message">
                <div className="message-body">{templates[selectedTemplate].description}</div>
              </article>
              {templates[selectedTemplate].resources && (
                <div className="field is-horizontal">
                  <div className="field-label">
                    <label className="label" htmlFor="inputIncludeResources">
                      <FormattedMessage {...messages.resources} />
                    </label>
                  </div>
                  <div className="field-body">
                    <div className="field">
                      <div className="control">
                        <div className="control">
                          <label className="checkbox">
                            <input
                              checked={templates[selectedTemplate].resources && includeResources}
                              id="inputIncludeResources"
                              name="includeResources"
                              onChange={this.onCheckboxChange}
                              type="checkbox"
                            />
                            <FormattedMessage {...messages.includeResources} />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                <FormattedMessage {...messages.cancel} />
              </a>
              <button
                className={classNames('card-footer-item', styles.cardFooterButton)}
                type="submit"
              >
                <FormattedMessage {...messages.create} />
              </button>
            </footer>
          </Form>
        </Modal>
      </div>
    );
  }
}
