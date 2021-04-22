import {
  FormOutput,
  ModalCard,
  SimpleForm,
  SimpleFormField,
  SimpleModalFooter,
  TextAreaField,
  Toggle,
} from '@appsemble/react-components';
import { AppSamlSecret } from '@appsemble/types';
import { stripPem, wrapPem } from '@appsemble/utils';
import { ReactElement } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useApp } from '../../..';
import styles from './index.module.css';
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
  return wrapPem(stripPem(value), 'CERTIFICATE');
}

/**
 * Render a modal for editing an Saml app secret.
 */
export function SamlModal({ onSubmit, secret, toggle }: AppSecretCardProps): ReactElement {
  const { formatMessage } = useIntl();
  const { app } = useApp();

  const urlPrefix = `${window.location.origin}/api/apps/${app.id}/saml/${secret.id}`;

  return (
    <ModalCard
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
        disabled={app.locked}
        help={<FormattedMessage {...messages.nameHelp} />}
        icon="user"
        label={<FormattedMessage {...messages.nameLabel} />}
        name="name"
        required
      />
      <SimpleFormField
        disabled={app.locked}
        help={<FormattedMessage {...messages.iconHelp} />}
        icon="image"
        label={<FormattedMessage {...messages.iconLabel} />}
        name="icon"
        required
      />
      <SimpleFormField
        disabled={app.locked}
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
        disabled={app.locked}
        help={<FormattedMessage {...messages.idpEntityIdHelp} />}
        icon="code"
        label={<FormattedMessage {...messages.idpEntityIdLabel} />}
        name="entityId"
        placeholder="https://example.com/saml/metadata.xml"
        type="url"
        validityMessages={{ typeMismatch: <FormattedMessage {...messages.badUrl} /> }}
      />
      <SimpleFormField
        datalist={['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress']}
        disabled={app.locked}
        help={<FormattedMessage {...messages.emailAttributeHelp} />}
        icon="envelope"
        label={<FormattedMessage {...messages.emailAttributeLabel} />}
        name="emailAttribute"
      />
      <SimpleFormField
        datalist={[
          'http://schemas.microsoft.com/identity/claims/displayname',
          'http://schemas.microsoft.com/identity/claims/name',
        ]}
        disabled={app.locked}
        help={<FormattedMessage {...messages.nameAttributeHelp} />}
        icon="user"
        label={<FormattedMessage {...messages.nameAttributeLabel} />}
        name="nameAttribute"
      />
      <SimpleFormField
        className={styles.certificate}
        component={TextAreaField}
        disabled={app.locked}
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
        placeholder={formatMessage(messages.acsUrlPlaceholder)}
        type="url"
        value={secret.id ? `${urlPrefix}/acs` : ''}
      />
      <FormOutput
        copyErrorMessage={formatMessage(messages.spEntityIdCopyError)}
        copySuccessMessage={formatMessage(messages.spEntityIdCopySuccess)}
        help={<FormattedMessage {...messages.spEntityIdHelp} />}
        icon="route"
        label={<FormattedMessage {...messages.spEntityIdLabel} />}
        name="redirectUri"
        placeholder={formatMessage(messages.spEntityIdPlaceholder)}
        value={secret.id ? `${urlPrefix}/metadata.xml` : ''}
      />
      <SimpleFormField
        className={styles.certificate}
        component={FormOutput}
        copyErrorMessage={formatMessage(messages.spCertificateCopyError)}
        copySuccessMessage={formatMessage(messages.spCertificateCopySuccess)}
        disabled={app.locked}
        help={<FormattedMessage {...messages.spCertificateHelp} />}
        label={<FormattedMessage {...messages.spCertificateLabel} />}
        multiline
        name="spCertificate"
        placeholder={formatMessage(messages.spCertificatePlaceholder)}
        // @ts-expect-error This can’t be properly typed.
        rows={certificateRows + 4}
      />
    </ModalCard>
  );
}
