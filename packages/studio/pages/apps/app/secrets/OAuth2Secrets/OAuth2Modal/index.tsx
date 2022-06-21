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
  Toggle,
  useConfirmation,
  useMessages,
} from '@appsemble/react-components';
import { AppOAuth2Secret } from '@appsemble/types';
import axios from 'axios';
import { ReactElement } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useParams } from 'react-router-dom';

import { useApp } from '../../..';
import styles from './index.module.css';
import { messages } from './messages';

interface AppSecretCardProps {
  /**
   * Called when the provider has been updated successfully.
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

  /**
   * Called when the secret has been updated successfully.
   */
  onDeleted?: (secret: AppOAuth2Secret) => void;
}

/**
 * Render a modal for editing an OAuth2 app secret.
 */
export function OAuth2Modal({
  onDeleted,
  onSubmit,
  secret,
  toggle,
}: AppSecretCardProps): ReactElement {
  const { formatMessage } = useIntl();
  const {
    app: { locked },
  } = useApp();
  const { lang } = useParams<{ lang: string }>();

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
        disabled={locked}
        help={<FormattedMessage {...messages.nameHelp} />}
        icon="tag"
        label={<FormattedMessage {...messages.nameLabel} />}
        name="name"
        required
      />
      <SimpleFormField
        disabled={locked}
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
        disabled={locked}
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
        disabled={locked}
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
        disabled={locked}
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
        disabled={locked}
        help={<FormattedMessage {...messages.clientSecretHelp} />}
        label={<FormattedMessage {...messages.clientSecretLabel} />}
        name="clientSecret"
        required
      />
      <SimpleFormField
        component={TagsField}
        delimiter=" "
        disabled={locked}
        help={<FormattedMessage {...messages.scopeHelp} />}
        label={<FormattedMessage {...messages.scopeLabel} />}
        name="scope"
        required
      />
      <SimpleFormField
        disabled={locked}
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
        disabled={locked}
        help={
          <FormattedMessage
            {...messages.remapperHelp}
            values={{
              link: (link: string) => (
                <Link target="_blank" to={`/${lang}/docs/guide/remappers`}>
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
