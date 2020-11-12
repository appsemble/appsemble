import {
  FormOutput,
  JSONField,
  Modal,
  PasswordField,
  SimpleForm,
  SimpleFormField,
  SimpleModalFooter,
  TagsField,
  Toggle,
} from '@appsemble/react-components';
import { AppOAuth2Secret } from '@appsemble/types';
import React, { ReactElement } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { messages } from './messages';

interface AppSecretCardProps {
  /**
   * Called when the provider has been updated succesfully.
   *
   * @param newProvider - The new provider values.
   * @param oldProvider - The old provider values to replace..
   */
  onSubmit: (values: AppOAuth2Secret) => Promise<void>;

  /**
   * The current provider values.
   */
  secret: AppOAuth2Secret;

  /**
   * The toggle used for managing the modal.
   */
  toggle: Toggle;
}

/**
 * Render a modal for editing an OAuth2 app secret.
 */
export function OAuth2Modal({ onSubmit, secret, toggle }: AppSecretCardProps): ReactElement {
  const { formatMessage } = useIntl();

  return (
    <Modal
      component={SimpleForm}
      defaultValues={secret}
      footer={
        <SimpleModalFooter
          cancelLabel={<FormattedMessage {...messages.close} />}
          onClose={toggle.disable}
          submitLabel={<FormattedMessage {...messages.save} />}
        />
      }
      isActive={toggle.enabled}
      onClose={toggle.disable}
      onSubmit={onSubmit}
      title={<FormattedMessage {...messages.modalTitle} />}
    >
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
    </Modal>
  );
}
