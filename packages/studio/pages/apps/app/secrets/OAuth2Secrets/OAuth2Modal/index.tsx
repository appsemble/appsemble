import {
  Button,
  FormOutput,
  JSONField,
  ModalCard,
  PasswordField,
  SimpleForm,
  SimpleFormField,
  SimpleModalFooter,
  TagsField,
  type Toggle,
  useConfirmation,
  useMessages,
} from '@appsemble/react-components';
import { type AppOAuth2Secret } from '@appsemble/types';
import axios from 'axios';
import { type ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

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
  readonly onSubmit: (values: AppOAuth2Secret) => Promise<void>;

  /**
   * The current provider values.
   */
  readonly secret: AppOAuth2Secret;

  /**
   * The toggle used for managing the modal.
   */
  readonly toggle: Toggle;

  /**
   * Called when the secret has been updated successfully.
   */
  readonly onDeleted?: (secret: AppOAuth2Secret) => void;
}

/**
 * Render a modal for editing an OAuth2 app secret.
 */
export function OAuth2Modal({
  onDeleted,
  onSubmit,
  secret,
  toggle,
}: AppSecretCardProps): ReactNode {
  const { formatMessage } = useIntl();
  const {
    app: { locked },
  } = useApp();

  const push = useMessages();
  const { app } = useApp();

  const onDelete = useConfirmation({
    title: <FormattedMessage {...messages.deleteWarningTitle} />,
    body: <FormattedMessage {...messages.deleteWarning} />,
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: <FormattedMessage {...messages.delete} />,
    color: 'danger',
    async action() {
      await axios.delete(`/api/apps/${app.id}/secrets/oauth2/${secret.id}`);

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
        disabled={locked !== 'unlocked'}
        help={<FormattedMessage {...messages.nameHelp} />}
        icon="tag"
        label={<FormattedMessage {...messages.nameLabel} />}
        name="name"
        required
      />
      <SimpleFormField
        disabled={locked !== 'unlocked'}
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
        disabled={locked !== 'unlocked'}
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
        disabled={locked !== 'unlocked'}
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
        disabled={locked !== 'unlocked'}
        help={<FormattedMessage {...messages.clientIdHelp} />}
        icon="fingerprint"
        label={<FormattedMessage {...messages.clientIdLabel} />}
        name="clientId"
        required
      />
      <SimpleFormField
        // https://stackoverflow.com/questions/15738259
        autoComplete="new-password"
        component={PasswordField}
        disabled={locked !== 'unlocked'}
        help={<FormattedMessage {...messages.clientSecretHelp} />}
        label={<FormattedMessage {...messages.clientSecretLabel} />}
        name="clientSecret"
        required
      />
      <SimpleFormField
        component={TagsField}
        delimiter=" "
        disabled={locked !== 'unlocked'}
        help={<FormattedMessage {...messages.scopeHelp} />}
        label={<FormattedMessage {...messages.scopeLabel} />}
        name="scope"
        required
      />
      <SimpleFormField
        disabled={locked !== 'unlocked'}
        help={
          <FormattedMessage
            {...messages.userInfoUrlHelp}
            values={{
              n: () => (
                <>
                  <br />
                  <br />
                </>
              ),
              info: (w) => <i>{w}</i>,
            }}
          />
        }
        icon="id-card"
        label={<FormattedMessage {...messages.userInfoUrlLabel} />}
        name="userInfoUrl"
        placeholder="https://example.com/userinfo"
        type="url"
        validityMessages={{
          typeMismatch: <FormattedMessage {...messages.badUrl} />,
        }}
      />
      <SimpleFormField
        component={JSONField}
        disabled={locked !== 'unlocked'}
        help={
          <FormattedMessage
            {...messages.remapperHelp}
            values={{
              link: (link) => (
                <Link target="_blank" to="../../../docs/03-guide/remappers">
                  {link}
                </Link>
              ),
            }}
          />
        }
        label={<FormattedMessage {...messages.remapperLabel} />}
        name="remapper"
      />
      {onDeleted ? (
        <Button className={styles.deleteButton} color="danger" icon="trash" onClick={onDelete}>
          <FormattedMessage {...messages.deleteButton} />
        </Button>
      ) : null}
    </ModalCard>
  );
}
