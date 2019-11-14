import { Checkbox, Form, FormComponent, Icon, Input } from '@appsemble/react-components';
import { App, Message } from '@appsemble/types';
import { normalize } from '@appsemble/utils';
import axios from 'axios';
import React, { FormEvent, ReactText } from 'react';
import { FormattedMessage, WrappedComponentProps } from 'react-intl';
import { RouteComponentProps } from 'react-router-dom';

import styles from './AppSettings.css';
import messages from './messages';

export interface AppSettingsProps extends RouteComponentProps<{ id: string }> {
  app: App;
  push: (message: Message | string) => void;
  updateApp: (app: App) => void;
}

interface AppSettingsState {
  domain?: string;
  path: string;
  icon: File;
  iconUrl: string;
  private: boolean;
  originalValues: { domain?: string; path: string; private: boolean };
  dirty: boolean;
}

export default class AppSettings extends React.Component<
  AppSettingsProps & WrappedComponentProps,
  AppSettingsState
> {
  state: AppSettingsState = {
    domain: '',
    private: null,
    path: '',
    icon: undefined,
    iconUrl: `/api/apps/${this.props.match.params.id}/icon`,
    originalValues: undefined,
    dirty: false,
  };

  async componentDidMount(): Promise<void> {
    const { app } = this.props;

    this.setState({
      domain: app.domain,
      path: app.path,
      private: app.private,
      originalValues: app,
    });
  }

  onSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();

    const { app, push, updateApp, intl } = this.props;
    const { domain, path, private: isPrivate, icon, originalValues } = this.state;

    const data = new FormData();

    if (domain !== originalValues.domain) {
      data.set('domain', domain);
    }

    if (path !== originalValues.path) {
      data.set('path', path);
    }

    if (isPrivate !== originalValues.private) {
      data.set('private', String(isPrivate));
    }

    if (icon) {
      data.set('icon', icon);
    }

    try {
      const { data: response } = await axios.patch(`/api/apps/${app.id}`, data);

      this.setState({
        path: response.path,
        private: response.private,
        dirty: false,
        originalValues: response,
      });
      updateApp(response);
      push({ color: 'success', body: intl.formatMessage(messages.updateSuccess) });
    } catch (ex) {
      push({ color: 'danger', body: intl.formatMessage(messages.updateError) });
    }
  };

  onChange = (event: React.ChangeEvent<HTMLInputElement>, value: ReactText | boolean): void => {
    // See: https://github.com/Microsoft/TypeScript/issues/13948
    this.setState({ [event.target.name]: value, dirty: true } as any);
  };

  onIconChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { match } = this.props;
    const { id } = match.params;
    const file = e.target.files[0];

    this.setState({
      dirty: true,
      icon: file,
      iconUrl: file ? URL.createObjectURL(file) : `/api/apps/${id}/icon`,
    });
  };

  render(): JSX.Element {
    const { domain, iconUrl, icon, private: isPrivate, path, dirty } = this.state;
    const { app, intl } = this.props;

    return (
      <Form onSubmit={this.onSubmit}>
        <FormComponent id="icon-upload" label={<FormattedMessage {...messages.icon} />}>
          <figure className={`image is-128x128 ${styles.iconContainer}`}>
            <img alt={intl.formatMessage(messages.icon)} className={styles.icon} src={iconUrl} />
          </figure>
          <div className="file has-name">
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
              <span className="file-name">
                {(icon && icon.name) || <FormattedMessage {...messages.noFile} />}
              </span>
            </label>
          </div>
          <p className="help">
            <FormattedMessage {...messages.iconDescription} />
          </p>
        </FormComponent>
        <div className={styles.private}>
          <Checkbox
            className="is-marginless"
            help={<FormattedMessage {...messages.private} />}
            label={<FormattedMessage {...messages.privateLabel} />}
            name="private"
            onChange={this.onChange}
            value={!!isPrivate}
          />
          <p className="help">
            <FormattedMessage {...messages.privateDescription} />
          </p>
        </div>
        <Input
          help={
            <FormattedMessage
              {...messages.pathDescription}
              values={{ basePath: `${window.location.origin}/@${app.OrganizationId}/` }}
            />
          }
          label={<FormattedMessage {...messages.path} />}
          name="path"
          onChange={this.onChange}
          placeholder={normalize(app.definition.name)}
          required
          value={path}
        />
        <Input
          help={
            <FormattedMessage
              {...messages.domainDescription}
              values={{
                documentation: (
                  <a href="https://appsemble.dev/dns" rel="noopener noreferrer" target="_blank">
                    <FormattedMessage {...messages.documentation} />
                  </a>
                ),
              }}
            />
          }
          label={<FormattedMessage {...messages.domain} />}
          name="domain"
          onChange={this.onChange}
          value={domain}
        />
        <button className="button" disabled={!dirty} type="submit">
          <FormattedMessage {...messages.saveChanges} />
        </button>
      </Form>
    );
  }
}
