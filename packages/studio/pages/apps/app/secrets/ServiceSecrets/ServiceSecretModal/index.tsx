import {
  Button,
  ModalCard,
  NavLink,
  SelectField,
  SimpleForm,
  SimpleFormField,
  SimpleModalFooter,
  TagsField,
  type Toggle,
  useConfirmation,
  useMessages,
} from '@appsemble/react-components';
import { type AppServiceSecret, type ServiceAuthenticationMethod } from '@appsemble/types';
import axios from 'axios';
import { type ChangeEvent, type ReactElement, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';

import { SwitchField } from './ConditionalFields/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';
import { useApp } from '../../../index.js';

interface ServiceSecretCardProps {
  /**
   * Called when the secret has been updated successfully.
   *
   * @param secret The relevant service secrets to save.
   */
  submit: (secret: AppServiceSecret) => Promise<void>;

  /**
   * The current service secret values.
   */
  secret: AppServiceSecret;

  /**
   * The toggle used for managing the modal.
   */
  toggle: Toggle;

  /**
   * Called when the service secret has been deleted successfully.
   */
  onDeleted?: (secret: AppServiceSecret) => void;
}

/**
 * Render a modal for editing an app service secret.
 */
export function ServiceSecretsModal({
  onDeleted,
  secret,
  submit,
  toggle,
}: ServiceSecretCardProps): ReactElement {
  const { formatMessage } = useIntl();
  const {
    app: { locked },
  } = useApp();

  const push = useMessages();
  const { app } = useApp();
  const [selectedMethod, setSelectedMethod] = useState(secret.authenticationMethod || 'http-basic');

  const onClose = useCallback(() => {
    setSelectedMethod('http-basic');
    toggle.disable();
  }, [toggle]);

  const onSubmit = useCallback(
    (values: AppServiceSecret) => {
      const { urlPatterns, ...props } = values;
      submit({ ...props, urlPatterns: String(urlPatterns) });
      onClose();
    },
    [onClose, submit],
  );

  const onDelete = useConfirmation({
    title: <FormattedMessage {...messages.deleteWarningTitle} />,
    body: <FormattedMessage {...messages.deleteWarning} />,
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: <FormattedMessage {...messages.delete} />,
    color: 'danger',
    async action() {
      await axios.delete(`/api/apps/${app.id}/secrets/service/${secret.id}`);

      push({
        body: formatMessage(messages.deleteSuccess, { name: secret.serviceName }),
        color: 'info',
      });
      onDeleted(secret);
    },
  });

  const onSelect = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedMethod(event.target.value as ServiceAuthenticationMethod);
  }, []);

  const { lang } = useParams<{ lang: string }>();

  return (
    <ModalCard
      component={SimpleForm}
      defaultValues={secret}
      footer={
        <SimpleModalFooter
          cancelLabel={<FormattedMessage {...messages.close} />}
          onClose={onClose}
          submitLabel={<FormattedMessage {...messages.save} />}
        />
      }
      isActive={toggle.enabled}
      onClose={onClose}
      onSubmit={onSubmit}
      title={<FormattedMessage {...messages.modalTitle} />}
    >
      <p className="mb-2">
        <FormattedMessage {...messages.docs} />
        <NavLink title="docs" to={`/${lang}/docs/03-guide/service`}>
          <span>docs</span>
        </NavLink>
      </p>
      <SimpleFormField
        disabled={locked}
        help={<FormattedMessage {...messages.serviceNameHelp} />}
        label={<FormattedMessage {...messages.serviceNameLabel} />}
        name="serviceName"
      />
      <SimpleFormField
        component={TagsField}
        disabled={locked}
        help={<FormattedMessage {...messages.serviceSecretHelp} />}
        label={<FormattedMessage {...messages.serviceSecretLabel} />}
        name="urlPatterns"
        placeholder="https://example.com/api"
        required
      />
      <SimpleFormField
        className={styles.select}
        component={SelectField}
        disabled={locked}
        fullWidth
        help={<FormattedMessage {...messages.methodHelp} />}
        label={<FormattedMessage {...messages.methodLabel} />}
        name="authenticationMethod"
        onChange={onSelect}
        required
      >
        <option value="http-basic">HTTP basic authentication</option>
        <option value="client-certificate">Client certificate authentication</option>
        <option value="client-credentials">OAuth client credentials</option>
        <option value="cookie">Cookie authentication</option>
        <option value="custom-header">Header based authentication</option>
        <option value="query-parameter">Query parameter</option>
      </SimpleFormField>
      <SwitchField disabled={locked} method={selectedMethod} />
      {onDeleted ? (
        <Button className={styles.deleteButton} color="danger" icon="trash" onClick={onDelete}>
          <FormattedMessage {...messages.deleteButton} />
        </Button>
      ) : null}
    </ModalCard>
  );
}