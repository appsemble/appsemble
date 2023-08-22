import {
  Button,
  CardFooterButton,
  CheckboxField,
  Content,
  DateTimeField,
  FormOutput,
  Join,
  Loader,
  Message,
  ModalCard,
  SimpleForm,
  SimpleFormField,
  SimpleModalFooter,
  Table,
  Title,
  useConfirmation,
  useData,
  useMeta,
  useToggle,
} from '@appsemble/react-components';
import { type OAuth2ClientCredentials } from '@appsemble/types';
import { has, scopes as knownScopes } from '@appsemble/utils';
import axios from 'axios';
import { type ReactElement, useCallback, useState } from 'react';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import { useLocation } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';

interface FormValues {
  description: string;
  expires: string;
  'blocks:write': boolean;
  'blocks:delete': boolean;
  'organizations:write': boolean;
  'resources:read': boolean;
  'resources:write': boolean;
  'apps:write': boolean;
  'teams:read': boolean;
  'teams:write': boolean;
  'assets:write': boolean;
}

export function ClientCredentialsPage(): ReactElement {
  useMeta(messages.title);
  const location = useLocation();
  const search = new URLSearchParams(location.search);
  const callback = search.get('callback');
  const suggestedDescription = search.get('description');

  const { formatMessage } = useIntl();
  const {
    data: clients,
    error,
    loading,
    refresh,
    setData: setClients,
  } = useData<OAuth2ClientCredentials[]>('/api/oauth2/client-credentials');
  const [newClientCredentials, setNewClientCredentials] = useState<string>(null);
  const modal = useToggle(Boolean(callback));

  const resetModal = useCallback(() => {
    modal.disable();
    // The modal closing animation takes 300ms.
    setTimeout(() => setNewClientCredentials(null), 300);
  }, [modal]);

  const registerClient = useCallback(
    async ({ description, expires, ...values }: FormValues) => {
      const scopes = Object.entries(values)
        .filter(([key, value]) => value && (knownScopes as readonly string[]).includes(key))
        .map(([key]) => key);
      const { data } = await axios.post<OAuth2ClientCredentials>('/api/oauth2/client-credentials', {
        description,
        expires: expires ? new Date(expires) : undefined,
        scopes,
      });
      const newCredentials = `${data.id}:${data.secret}`;
      if (/^\d{4,5}$/.test(callback)) {
        try {
          // It may be tempting to use localhost here, but that’s insecure, as it may be mapped to
          // another IP address.
          await axios.post(`http://127.0.0.1:${callback}`, { credentials: newCredentials });
        } catch {
          // If this fails, let the user copy-paste as usual.
        }
      }
      setNewClientCredentials(newCredentials);
      setClients((oldClients) => [...oldClients, data]);
    },
    [callback, setClients],
  );

  const onDelete = useConfirmation({
    title: <FormattedMessage {...messages.deleteTitle} />,
    body: <FormattedMessage {...messages.deleteBody} />,
    cancelLabel: <FormattedMessage {...messages.deleteCancel} />,
    confirmLabel: <FormattedMessage {...messages.deleteConfirm} />,
    async action(client: OAuth2ClientCredentials) {
      await axios.delete(`/api/oauth2/client-credentials/${client.id}`);
      setClients(clients.filter((c) => c.id !== client.id));
    },
  });

  if (error) {
    return (
      <Content padding>
        <Message color="danger">
          <p>
            <FormattedMessage {...messages.loadError} />
          </p>
          <Button color="danger" onClick={refresh}>
            <FormattedMessage {...messages.retry} />
          </Button>
        </Message>
      </Content>
    );
  }

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <Title>
        <FormattedMessage {...messages.title} />
      </Title>
      <p className="content">
        <FormattedMessage {...messages.explanation} />
      </p>
      <Button color="primary" onClick={modal.enable}>
        <FormattedMessage {...messages.register} />
      </Button>
      <ModalCard
        component={SimpleForm}
        defaultValues={{
          description: suggestedDescription,
          expires: '',
          'blocks:write': false,
          'blocks:delete': false,
          'organizations:write': false,
          'resources:read': false,
          'resources:write': false,
          'apps:write': false,
          'teams:read': false,
          'teams:write': false,
          'assets:write': false,
        }}
        footer={
          newClientCredentials ? (
            <CardFooterButton onClick={resetModal}>
              <FormattedMessage {...messages.close} />
            </CardFooterButton>
          ) : (
            <SimpleModalFooter
              cancelLabel={<FormattedMessage {...messages.cancel} />}
              onClose={resetModal}
              submitLabel={<FormattedMessage {...messages.submit} />}
            />
          )
        }
        isActive={modal.enabled}
        onClose={resetModal}
        onSubmit={registerClient}
        resetOnSuccess
        title={<FormattedMessage {...messages.register} />}
      >
        {newClientCredentials ? (
          <FormOutput
            copyErrorMessage={formatMessage(messages.copiedError)}
            copySuccessMessage={formatMessage(messages.copiedSuccess)}
            help={<FormattedMessage {...messages.credentialsHelp} />}
            label={<FormattedMessage {...messages.credentials} />}
            name="clientCredentials"
            value={newClientCredentials}
          />
        ) : (
          <>
            <SimpleFormField
              help={<FormattedMessage {...messages.descriptionHelp} />}
              label={<FormattedMessage {...messages.description} />}
              maxLength={50}
              name="description"
              required
            />
            <SimpleFormField
              component={DateTimeField}
              help={<FormattedMessage {...messages.expiresHelp} />}
              iso
              label={<FormattedMessage {...messages.expires} />}
              name="expires"
              type="date"
            />
            <SimpleFormField
              component={CheckboxField}
              label="blocks:write"
              name="blocks:write"
              title={<FormattedMessage {...messages['blocks:write']} />}
            />
            <SimpleFormField
              component={CheckboxField}
              label="blocks:delete"
              name="blocks:delete"
              title={<FormattedMessage {...messages['blocks:delete']} />}
            />
            <SimpleFormField
              component={CheckboxField}
              label="organizations:write"
              name="organizations:write"
              title={<FormattedMessage {...messages['organizations:write']} />}
            />
            <SimpleFormField
              component={CheckboxField}
              label="apps:write"
              name="apps:write"
              title={<FormattedMessage {...messages['apps:write']} />}
            />
            <SimpleFormField
              component={CheckboxField}
              label="resources:read"
              name="resources:read"
              title={<FormattedMessage {...messages['resources:read']} />}
            />
            <SimpleFormField
              component={CheckboxField}
              label="resources:write"
              name="resources:write"
              title={<FormattedMessage {...messages['resources:write']} />}
            />
            <SimpleFormField
              component={CheckboxField}
              label="teams:read"
              name="teams:read"
              title={<FormattedMessage {...messages['teams:read']} />}
            />
            <SimpleFormField
              component={CheckboxField}
              label="teams:write"
              name="teams:write"
              title={<FormattedMessage {...messages['teams:write']} />}
            />
            <SimpleFormField
              component={CheckboxField}
              label="assets:write"
              name="assets:write"
              title={<FormattedMessage {...messages['assets:write']} />}
            />
          </>
        )}
      </ModalCard>
      {clients.length ? (
        <Table className={styles.table}>
          <thead>
            <tr>
              <th>
                <FormattedMessage {...messages.description} />
              </th>
              <th>
                <FormattedMessage {...messages.created} />
              </th>
              <th>
                <FormattedMessage {...messages.expires} />
              </th>
              <th colSpan={2}>
                <FormattedMessage {...messages.scope} />
              </th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id}>
                <td>{client.description}</td>
                <td>
                  <time dateTime={client.$created}>
                    <FormattedDate value={client.$created} />
                  </time>
                </td>
                <td>
                  {client.expires ? (
                    <time dateTime={client.expires}>
                      <FormattedDate value={client.expires} />
                    </time>
                  ) : (
                    <FormattedMessage {...messages.never} />
                  )}
                </td>
                <td>
                  <Join separator=", ">
                    {client.scopes.map((scope) => (
                      <data
                        className={styles.scope}
                        key={scope}
                        title={formatMessage(
                          has(messages, scope)
                            ? messages[scope as keyof typeof messages]
                            : messages.unknownScope,
                        )}
                        value={scope}
                      >
                        {scope}
                      </data>
                    ))}
                  </Join>
                </td>
                <td>
                  <Button
                    className="is-pulled-right"
                    color="danger"
                    onClick={() => onDelete(client)}
                  >
                    <FormattedMessage {...messages.revoke} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <p>
          <FormattedMessage {...messages.empty} />
        </p>
      )}
    </>
  );
}
