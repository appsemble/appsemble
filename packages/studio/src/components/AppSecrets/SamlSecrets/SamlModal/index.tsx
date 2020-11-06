import {
  FormOutput,
  Modal,
  SimpleForm,
  SimpleFormField,
  SimpleModalFooter,
  TextAreaField,
  Toggle,
} from '@appsemble/react-components';
import { AppSamlSecret } from '@appsemble/types';
import React, { ReactElement } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import styles from './index.css';
import { messages } from './messages';

interface AppSecretCardProps {
  /**
   * Called when the provider has been updated succesfully.
   *
   * @param newProvider - The new provider values.
   * @param oldProvider - The old provider values to replace..
   */
  onSubmit: (values: AppSamlSecret) => Promise<void>;

  /**
   * The current provider values.
   */
  secret: AppSamlSecret;

  /**
   * The toggle used for managing the modal.
   */
  toggle: Toggle;
}

const certificateRows = 14;

function processCertificate(value: string): string {
  return `-----BEGIN CERTIFICATE-----\n${value
    .replace(/^[\s-]*BEGIN CERTIFICATE[\s-]*/g, '')
    .replace(/[\s-]*END CERTIFICATE[\s-]*$/g, '')
    .replace(/\r?\n/g, '\n')
    .trim()}\n-----END CERTIFICATE-----`;
}

/**
 * Render a modal for editing an Saml app secret.
 */
export function SamlModal({ onSubmit, secret, toggle }: AppSecretCardProps): ReactElement {
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
        icon="user"
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
      <SimpleFormField
        help={<FormattedMessage {...messages.ssoUrlHelp} />}
        icon="user"
        label={<FormattedMessage {...messages.ssoUrlLabel} />}
        name="ssoUrl"
        placeholder="https://example.com/saml/login"
        required
        type="url"
        validityMessages={{ typeMismatch: <FormattedMessage {...messages.badUrl} /> }}
      />
      <SimpleFormField
        help={<FormattedMessage {...messages.idpEntityIdHelp} />}
        icon="code"
        label={<FormattedMessage {...messages.idpEntityIdLabel} />}
        name="entityId"
        placeholder="https://example.com/saml/metadata.xml"
        type="url"
        validityMessages={{ typeMismatch: <FormattedMessage {...messages.badUrl} /> }}
      />
      <SimpleFormField
        className={styles.certificate}
        component={TextAreaField}
        help={<FormattedMessage {...messages.idpCertificateHelp} />}
        label={<FormattedMessage {...messages.idpCertificateLabel} />}
        name="idpCertificate"
        placeholder={`-----BEGIN CERTIFICATE-----${'\r\n'.repeat(
          certificateRows - 1,
        )}-----END CERTIFICATE-----`}
        preprocess={processCertificate}
        rows={certificateRows}
      />
      <FormOutput
        copyErrorMessage={formatMessage(messages.acsUrlCopyError)}
        copySuccessMessage={formatMessage(messages.acsUrlCopySuccess)}
        help={<FormattedMessage {...messages.acsUrlHelp} />}
        icon="user"
        label={<FormattedMessage {...messages.acsUrlLabel} />}
        name="acsUrl"
        type="url"
        value={`${window.location.origin}/api/saml/acs`}
      />
      <FormOutput
        copyErrorMessage={formatMessage(messages.spEntityIdCopyError)}
        copySuccessMessage={formatMessage(messages.spEntityIdCopySuccess)}
        help={<FormattedMessage {...messages.spEntityIdHelp} />}
        icon="route"
        label={<FormattedMessage {...messages.spEntityIdLabel} />}
        name="redirectUri"
        value={`${window.location.origin}/api/saml/metadata.xml`}
      />
      <SimpleFormField
        className={styles.certificate}
        component={FormOutput}
        copyErrorMessage={formatMessage(messages.spCertificateCopyError)}
        copySuccessMessage={formatMessage(messages.spCertificateCopySuccess)}
        help={<FormattedMessage {...messages.spCertificateHelp} />}
        label={<FormattedMessage {...messages.spCertificateLabel} />}
        multiline
        name="spCertificate"
        // @ts-expect-error This can’t be properly typed.
        rows={certificateRows + 4}
      />
    </Modal>
  );
}
