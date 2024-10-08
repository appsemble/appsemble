import {
  Button,
  FormOutput,
  ModalCard,
  SimpleForm,
  SimpleFormField,
  SimpleModalFooter,
  TextAreaField,
  type Toggle,
  useConfirmation,
  useMessages,
} from '@appsemble/react-components';
import { type AppSamlSecret } from '@appsemble/types';
import { stripPem, wrapPem } from '@appsemble/utils';
import axios from 'axios';
import { type ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import { useApp } from '../../../index.js';

interface AppSecretCardProps {
  /**
   * Called when the provider has been updated successfully.
   *
   * @param newProvider The new provider values.
   * @param oldProvider The old provider values to replace..
   */
  readonly onSubmit: (values: AppSamlSecret) => Promise<void>;

  /**
   * The current provider values.
   */
  readonly secret: AppSamlSecret;

  /**
   * The toggle used for managing the modal.
   */
  readonly toggle: Toggle;

  /**
   * Called when the secret has been updated successfully.
   */
  readonly onDeleted?: (secret: AppSamlSecret) => void;
}

const certificateRows = 14;

function processCertificate(value: string): string {
  return wrapPem(stripPem(value), 'CERTIFICATE');
}

/**
 * Render a modal for editing an Saml app secret.
 */
export function SamlModal({ onDeleted, onSubmit, secret, toggle }: AppSecretCardProps): ReactNode {
  const { formatMessage } = useIntl();
  const { app } = useApp();

  const urlPrefix = `${window.location.origin}/api/apps/${app.id}/saml/${secret.id}`;

  const push = useMessages();

  const onDelete = useConfirmation({
    title: <FormattedMessage {...messages.deleteWarningTitle} />,
    body: <FormattedMessage {...messages.deleteWarning} />,
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: <FormattedMessage {...messages.delete} />,
    color: 'danger',
    async action() {
      await axios.delete(`/api/apps/${app.id}/secrets/saml/${secret.id}`);

      push({
        body: formatMessage(messages.deleteSuccess, { name: secret.name }),
        color: 'info',
      });
      onDeleted(secret);
    },
  });

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
        disabled={app.locked !== 'unlocked'}
        help={<FormattedMessage {...messages.nameHelp} />}
        icon="user"
        label={<FormattedMessage {...messages.nameLabel} />}
        name="name"
        required
      />
      <SimpleFormField
        disabled={app.locked !== 'unlocked'}
        help={<FormattedMessage {...messages.iconHelp} />}
        icon="image"
        label={<FormattedMessage {...messages.iconLabel} />}
        name="icon"
        required
      />
      <SimpleFormField
        disabled={app.locked !== 'unlocked'}
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
        disabled={app.locked !== 'unlocked'}
        help={<FormattedMessage {...messages.idpEntityIdHelp} />}
        icon="code"
        label={<FormattedMessage {...messages.idpEntityIdLabel} />}
        name="entityId"
        placeholder="https://example.com/saml/metadata.xml"
        type="url"
        validityMessages={{ typeMismatch: <FormattedMessage {...messages.badUrl} /> }}
      />
      {/* TODO suggest value based on what the server found */}
      <SimpleFormField
        datalist={['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress']}
        disabled={app.locked !== 'unlocked'}
        help={<FormattedMessage {...messages.emailAttributeHelp} />}
        icon="envelope"
        label={<FormattedMessage {...messages.emailAttributeLabel} />}
        name="emailAttribute"
      />
      {/* TODO suggest value based on what the server found */}
      <SimpleFormField
        datalist={[]}
        disabled={app.locked !== 'unlocked'}
        help={<FormattedMessage {...messages.emailVerifiedAttributeHelp} />}
        icon="check"
        label={<FormattedMessage {...messages.emailVerifiedAttributeLabel} />}
        name="emailVerifiedAttribute"
      />
      <SimpleFormField
        datalist={[
          'http://schemas.microsoft.com/identity/claims/displayname',
          'http://schemas.microsoft.com/identity/claims/name',
        ]}
        disabled={app.locked !== 'unlocked'}
        help={<FormattedMessage {...messages.nameAttributeHelp} />}
        icon="user"
        label={<FormattedMessage {...messages.nameAttributeLabel} />}
        name="nameAttribute"
      />
      <SimpleFormField
        datalist={['http://schemas.microsoft.com/identity/claims/objectidentifier']}
        disabled={app.locked !== 'unlocked'}
        help={<FormattedMessage {...messages.objectIdAttributeHelp} />}
        icon="user"
        label={<FormattedMessage {...messages.objectIdAttributeLabel} />}
        name="objectIdAttribute"
      />
      <SimpleFormField
        className={styles.certificate}
        component={TextAreaField}
        disabled={app.locked !== 'unlocked'}
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
        disabled={app.locked !== 'unlocked'}
        help={<FormattedMessage {...messages.spCertificateHelp} />}
        label={<FormattedMessage {...messages.spCertificateLabel} />}
        multiline
        name="spCertificate"
        placeholder={formatMessage(messages.spCertificatePlaceholder)}
        // @ts-expect-error This can’t be properly typed.
        rows={certificateRows + 4}
      />
      {onDeleted ? (
        <Button className={styles.deleteButton} color="danger" icon="trash" onClick={onDelete}>
          <FormattedMessage {...messages.deleteButton} />
        </Button>
      ) : null}
    </ModalCard>
  );
}
