import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import styles from './CreateAppCard.css';
import templates from '../../../../templates';

export default class CreateAppCard extends React.Component {
  static propTypes = {
    createApp: PropTypes.func.isRequired,
    history: PropTypes.shape().isRequired,
    intl: PropTypes.shape().isRequired,
    push: PropTypes.func.isRequired,
    user: PropTypes.shape().isRequired,
  };

  state = {
    modalOpen: false,
    selectedTemplate: 0,
    selectedOrganization: 0,
    appName: '',
    appDescription: '',
  };

  onChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  };

  onClick = async () => {
    this.setState({ modalOpen: true });
  };

  onKeyDown = async event => {
    if (event.key === 'Escape') {
      await this.onClose();
    }
  };

  onClose = async () => {
    this.setState({ modalOpen: false });
  };

  onCreate = async event => {
    event.preventDefault();

    const {
      createApp,
      history,
      push,
      intl: { formatMessage },
      user,
    } = this.props;
    const { appName, appDescription, selectedTemplate, selectedOrganization } = this.state;

    try {
      const template = templates[selectedTemplate].recipe;
      const app = await createApp(
        { ...template, name: appName, description: appDescription },
        user.organizations[selectedOrganization],
      );

      history.push(`/_/edit/${app.id}`);
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
    } = this.state;
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
        <form className="container" onSubmit={this.onCreate}>
          <div className={classNames('modal', { 'is-active': modalOpen })}>
            <div
              className="modal-background"
              onClick={this.onClose}
              onKeyDown={this.onKeyDown}
              role="presentation"
            />
            <div className="modal-content">
              <div className="card">
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
              </div>
            </div>
            <button className="modal-close is-large" onClick={this.onClose} type="button" />
          </div>
        </form>
      </div>
    );
  }
}
