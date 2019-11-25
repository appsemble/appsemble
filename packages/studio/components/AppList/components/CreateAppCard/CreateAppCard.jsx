import { Checkbox, Form, Input, Modal, Select } from '@appsemble/react-components';
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
    isPrivate: true,
  };

  async componentDidMount() {
    const { data: templates } = await axios.get('/api/templates');
    this.setState({ templates, loading: false });
  }

  onChange = (event, value) => {
    this.setState({ [event.target.name]: value });
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
      isPrivate,
    } = this.state;

    try {
      const { id, resources } = templates[selectedTemplate];
      const app = await createTemplateApp(
        {
          templateId: id,
          name: appName,
          isPrivate,
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
      isPrivate,
    } = this.state;

    if (loading || !templates.length) {
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
        <Modal
          className="is-paddingless"
          isActive={modalOpen}
          onClose={this.onClose}
          title={<FormattedMessage {...messages.createAppTitle} />}
        >
          <Form onSubmit={this.onCreate}>
            <div className={styles.controls}>
              <Input
                label={<FormattedMessage {...messages.name} />}
                maxLength={30}
                minLength={1}
                name="appName"
                onChange={this.onChange}
                placeholder={formatMessage(messages.name)}
                required
                value={appName}
              />
              <Select
                disabled={user.organizations.length === 1}
                label={<FormattedMessage {...messages.organization} />}
                name="selectedOrganization"
                onChange={this.onChange}
                required
                value={selectedOrganization}
              >
                {user.organizations.map((organization, index) => (
                  <option key={organization.id} value={index}>
                    {organization.id}
                  </option>
                ))}
              </Select>
              <Input
                label={<FormattedMessage {...messages.description} />}
                maxLength={80}
                name="appDescription"
                onChange={this.onChange}
                placeholder={formatMessage(messages.description)}
                type="textarea"
                value={appDescription}
              />
              <Select
                label={<FormattedMessage {...messages.template} />}
                name="selectedTemplate"
                onChange={this.onChange}
                required
                value={selectedTemplate}
              >
                {templates.map((template, index) => (
                  <option key={template.name} value={index}>
                    {template.name}
                  </option>
                ))}
              </Select>
              <article className="message">
                <div className="message-body">{templates[selectedTemplate].description}</div>
              </article>
              <Checkbox
                className="is-warning"
                help={<FormattedMessage {...messages.privateHelp} />}
                label={<FormattedMessage {...messages.private} />}
                name="isPrivate"
                onChange={this.onChange}
                value={isPrivate}
              />
              {templates[selectedTemplate].resources && (
                <Checkbox
                  help={<FormattedMessage {...messages.includeResources} />}
                  label={<FormattedMessage {...messages.resources} />}
                  name="includeResources"
                  onChange={this.onChange}
                  value={templates[selectedTemplate].resources && includeResources}
                />
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
