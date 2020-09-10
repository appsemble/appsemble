import {
  FormButtons,
  FormOutput,
  Icon,
  IconButton,
  JSONField,
  PasswordField,
  SimpleForm,
  SimpleFormField,
  SimpleSubmit,
  TagsField,
  Title,
  useToggle,
} from '@appsemble/react-components';
import type { AppOAuth2Secret } from '@appsemble/types';
import axios from 'axios';
import React, { ReactElement, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useApp } from '../../../AppContext';
import { messages } from './messages';

interface AppSecretCardProps {
  /**
   * Called when the provider has been updated succesfully.
   *
   * @param newProvider - The new provider values.
   * @param oldProvider - The old provider values to replace..
   */
  onUpdated: (newProvider: AppOAuth2Secret, oldProvider: AppOAuth2Secret) => void;

  /**
   * The current provider values.
   */
  secret: AppOAuth2Secret;
}

export function AppSecretCard({ onUpdated, secret }: AppSecretCardProps): ReactElement {
  const editing = useToggle();
  const { app } = useApp();
  const { formatMessage } = useIntl();

  const onSubmit = useCallback(
    async (values) => {
      let data: AppOAuth2Secret;
      if ('id' in values) {
        ({ data } = await axios.put<AppOAuth2Secret>(
          `/api/apps/${app.id}/secrets/oauth2${values.id}`,
          values,
        ));
      } else {
        ({ data } = await axios.post<AppOAuth2Secret>(
          `/api/apps/${app.id}/secrets/oauth2`,
          values,
        ));
      }
      editing.disable();
      onUpdated(data, secret);
    },
    [app, editing, onUpdated, secret],
  );

  return (
    <div className="box">
      <IconButton
        className="is-pulled-right"
        icon={editing.enabled ? 'times' : 'pencil-alt'}
        onClick={editing.toggle}
      />
      <Title level={5}>
        <Icon className="mr-0" icon={secret.icon} />
        {secret.name}
      </Title>
      {editing.enabled ? (
        <SimpleForm defaultValues={secret} onSubmit={onSubmit}>
          <SimpleFormField
            help={<FormattedMessage {...messages.nameHelp} />}
            icon="tag"
            label={<FormattedMessage {...messages.nameLabel} />}
            name="name"
            required
          />
          <SimpleFormField
            help={<FormattedMessage {...messages.iconHelp} />}
            icon="image"
            label={<FormattedMessage {...messages.iconLabel} />}
            name="icon"
            required
          />
          <FormOutput
            copyErrorMessage={formatMessage(messages.redirectUrlCopyError)}
            copySuccessMessage={formatMessage(messages.redirectUrlCopySuccess)}
            help={<FormattedMessage {...messages.redirectUrlHelp} />}
            icon="route"
            label={<FormattedMessage {...messages.redirectUrlLabel} />}
            name="redirectUri"
            value={`${window.location.origin}/callback`}
          />
          <SimpleFormField
            help={<FormattedMessage {...messages.authorizationUrlHelp} />}
            icon="external-link-alt"
            label={<FormattedMessage {...messages.authorizationUrlLabel} />}
            name="authorizationUrl"
            placeholder="https://example.com/oauth2/authorize"
            required
            type="url"
            validityMessages={{
              typeMismatch: <FormattedMessage {...messages.badUrl} />,
            }}
          />
          <SimpleFormField
            help={<FormattedMessage {...messages.tokenUrlHelp} />}
            icon="bezier-curve"
            label={<FormattedMessage {...messages.tokenUrlLabel} />}
            name="tokenUrl"
            placeholder="https://example.com/oauth2/token"
            required
            type="url"
            validityMessages={{
              typeMismatch: <FormattedMessage {...messages.badUrl} />,
            }}
          />
          <SimpleFormField
            help={<FormattedMessage {...messages.clientIdHelp} />}
            icon="fingerprint"
            label={<FormattedMessage {...messages.clientIdLabel} />}
            name="clientId"
            required
          />
          <SimpleFormField
            // https://stackoverflow.com/questions/15738259
            autoComplete="one-time-code"
            component={PasswordField}
            help={<FormattedMessage {...messages.clientSecretHelp} />}
            label={<FormattedMessage {...messages.clientSecretLabel} />}
            name="clientSecret"
            required
          />
          <SimpleFormField
            component={TagsField}
            delimiter=" "
            help={<FormattedMessage {...messages.scopeHelp} />}
            label={<FormattedMessage {...messages.scopeLabel} />}
            name="scope"
            required
          />
          <SimpleFormField
            help={<FormattedMessage {...messages.userInfoUrlHelp} />}
            icon="id-card"
            label={<FormattedMessage {...messages.userInfoUrlLabel} />}
            name="userInfoUrl"
            placeholder="https://example.com/oauth2/token"
            type="url"
            validityMessages={{
              typeMismatch: <FormattedMessage {...messages.badUrl} />,
            }}
          />
          <SimpleFormField
            component={JSONField}
            help={<FormattedMessage {...messages.remapperHelp} />}
            label={<FormattedMessage {...messages.remapperLabel} />}
            name="remapper"
          />
          <FormButtons>
            <SimpleSubmit>
              <FormattedMessage {...messages.save} />
            </SimpleSubmit>
          </FormButtons>
        </SimpleForm>
      ) : (
        <p className="has-text-grey-light">{secret.authorizationUrl}</p>
      )}
    </div>
  );
}
