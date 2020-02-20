import { Button, Checkbox, Form, FormComponent, Icon, Input } from '@appsemble/react-components';
import useMessages from '@appsemble/react-components/hooks/useMessages';
// import { App } from '@appsemble/types';
import { normalize } from '@appsemble/utils';
import axios from 'axios';
import React, { FormEvent, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

// import { RouteComponentProps } from 'react-router-dom';
import useApp from '../../hooks/useApp';
import styles from './AppSettings.css';
import messages from './messages';

// interface AppSettingsState {
//   domain?: string;
//   path: string;
//   icon: File;
//   iconUrl: string;
//   private: boolean;
//   originalValues: { domain?: string; path: string; private: boolean };
//   dirty: boolean;
// }

export default function AppSettings(): JSX.Element {
  const { app, refreshAppInfo } = useApp();
  const intl = useIntl();
  const [icon, setIcon] = useState();
  const [iconUrl, setIconUrl] = useState(app.iconUrl);
  const [inputs, setInputs] = useState(app);
  const [isPrivate, setIsPrivate] = useState(app.private);
  const push = useMessages();

  // AppSettingsState = {
  //   domain: '',
  //   private: null,
  //   path: '',
  //   icon: undefined,
  //   iconUrl: `/api/apps/${this.props.match.params.id}/icon`,
  //   originalValues: undefined,
  //   dirty: false,
  // };
  //
  // async componentDidMount(): Promise<void> {
  //   console.log(this.props.apps);
  //   const { apps } = this.props;
  //
  //   this.setState({
  //     domain: apps.domain,
  //     path: apps.path,
  //     private: apps.private,
  //     originalValues: apps,
  //   });
  // }

  const onSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    // const { domain, icon, originalValues, path, private: isPrivate } = this.state;
    // const push = this.context;
    const data = new FormData();

    if (app.domain !== inputs.domain) {
      data.set('domain', inputs.domain);
    }

    if (app.path !== inputs.path) {
      data.set('path', inputs.path);
    }

    if (app.private !== isPrivate) {
      data.set('private', String(isPrivate));
    }

    if (icon) {
      data.set('icon', iconUrl);
    }

    try {
      await axios.patch(`/api/apps/${app.id}`, data);
      //
      // this.setState({
      //   path: response.path,
      //   private: response.private,
      //   dirty: false,
      //   originalValues: response,
      // });

      refreshAppInfo();
      // <Message color="success">
      //   <FormattedMessage {...messages.updateSuccess} />
      // </Message>;
      push({ color: 'success', body: intl.formatMessage(messages.updateSuccess) });
    } catch (ex) {
      // <Message color="danger">
      //   <FormattedMessage {...messages.updateError} />
      // </Message>;
      push({ color: 'danger', body: intl.formatMessage(messages.updateError) });
    }
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement>): any => {
    event.persist();
    setInputs(val => ({ ...val, [event.target.name]: event.target.value }));
  };

  const onChangePrivate = (event: React.ChangeEvent<HTMLInputElement>): any => {
    event.persist();
    setIsPrivate(event.target.checked);
  };

  const onIconChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    // const { match } = this.props;
    // const { id } = match.params;
    const file = e.target.files[0];
    setIcon(file);
    setIconUrl(file ? URL.createObjectURL(file) : `/api/apps/${app.id}/icon`);

    refreshAppInfo();

    // this.setState({
    //   dirty: true,
    //   icon: file,
    //   iconUrl: file ? URL.createObjectURL(file) : `/api/apps/${id}/icon`,
    // });
  };

  // const { dirty, domain, icon, iconUrl, path, private: isPrivate } = this.state;

  return (
    <Form onSubmit={onSubmit}>
      <FormComponent id="icon-upload" label={<FormattedMessage {...messages.icon} />}>
        <figure className={`image is-128x128 ${styles.iconContainer}`}>
          <img alt={intl.formatMessage(messages.icon)} className={styles.icon} src={iconUrl} />
        </figure>
        <div className="file has-name">
          <label className="file-label" htmlFor="icon-upload">
            <input
              accept="image/jpeg, image/png, image/tiff, image/webp"
              className="file-input"
              id="icon-upload"
              name="icon"
              onChange={onIconChange}
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
          onChange={onChangePrivate}
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
        onChange={onChange}
        placeholder={normalize(app.definition.name)}
        required
        value={inputs.path}
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
        onChange={onChange}
        value={inputs.domain}
      />
      <Button type="submit">
        <FormattedMessage {...messages.saveChanges} />
      </Button>
    </Form>
  );
}
