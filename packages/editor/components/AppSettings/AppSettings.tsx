import { Checkbox, Form, FormComponent, Icon, Input } from '@appsemble/react-components';
import { App } from '@appsemble/types';
import { normalize } from '@appsemble/utils';
import axios from 'axios';
import React, { ReactText } from 'react';
import { FormattedMessage, WrappedComponentProps } from 'react-intl';
import { RouteComponentProps } from 'react-router-dom';

import styles from './AppSettings.css';
import messages from './messages';

export interface AppSettingsProps extends RouteComponentProps<{ id: string }> {
  app: App;
}

interface AppSettingsState {
  path: string;
  icon: File;
  iconUrl: string;
  private: boolean;
}

export default class AppSettings extends React.Component<
  AppSettingsProps & WrappedComponentProps,
  AppSettingsState
> {
  state: AppSettingsState = {
    private: false,
    path: undefined,
    icon: undefined,
    iconUrl: `/api/apps/${this.props.match.params.id}/icon`,
  };

  async componentDidMount(): Promise<void> {
    const {
      match: {
        params: { id },
      },
    } = this.props;

    const { data: settings } = await axios.get(`/api/apps/${id}/settings`);
    this.setState({ path: settings.path, private: settings.private });
  }

  onSubmit = async (): Promise<void> => {
    const { app } = this.props;
    const { path, private: isPrivate } = this.state;

    await axios.put(`/api/apps/1/settings/${app.id}/settings`, { path, private: isPrivate });
  };

  onChange = (event: React.ChangeEvent<HTMLInputElement>, value: ReactText | boolean): void => {
    // See: https://github.com/Microsoft/TypeScript/issues/13948
    this.setState({ [event.target.name]: value } as any);
  };

  onIconChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { match } = this.props;
    const { id } = match.params;
    const file = e.target.files[0];

    this.setState({
      icon: file,
      iconUrl: file ? URL.createObjectURL(file) : `/api/apps/${id}/icon`,
    });
  };

  render(): JSX.Element {
    const { iconUrl, icon, private: isPrivate, path } = this.state;
    const { app } = this.props;

    return (
      <Form onSubmit={this.onSubmit}>
        <FormComponent id="icon-upload" label={<FormattedMessage {...messages.icon} />}>
          <figure className={`image is-128x128 ${styles.icon}`}>
            <img alt="Icon" className="image is-128x128" src={iconUrl} />
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
              {
                <span className="file-name">
                  {(icon && icon.name) || <FormattedMessage {...messages.noFile} />}
                </span>
              }
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
              values={{ basePath: `${window.location.origin}/@${app.organizationId}/` }}
            />
          }
          label={<FormattedMessage {...messages.path} />}
          name="path"
          onChange={this.onChange}
          placeholder={normalize(app.name)}
          value={path}
        />
      </Form>
    );
  }
}
