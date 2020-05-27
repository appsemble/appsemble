import {
  Button,
  Calendar,
  CardFooterButton,
  Checkbox,
  Input,
  Join,
  Modal,
  SimpleForm,
  SimpleInput,
  Table,
  Title,
  useConfirmation,
  useToggle,
} from '@appsemble/react-components';
import { scopes as knownScopes } from '@appsemble/utils';
import axios from 'axios';
import * as React from 'react';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';

import type { OAuth2ClientCredentials } from '../../types';
import HelmetIntl from '../HelmetIntl';
import styles from './index.css';
import messages from './messages';

export default function ClientCredentials(): React.ReactElement {
  const intl = useIntl();
  const [clients, setClients] = React.useState<OAuth2ClientCredentials[]>([]);
  const [newClientCredentials, setNewClientCredentials] = React.useState<string>(null);
  const modal = useToggle();

  const registerClient = React.useCallback(
    async ({ description, expires, ...values }) => {
      const scopes = Object.entries(values)
        .filter(([key, value]) => value && knownScopes.includes(key))
        .map(([key]) => key);
      const { data } = await axios.post('/api/oauth2/client-credentials', {
        description,
        expires: expires ? new Date(expires) : undefined,
        scopes,
      });
      setNewClientCredentials(`${data.id}:${data.secret}`);
      setClients([...clients, data]);
    },
    [clients],
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

  React.useEffect(() => {
    (async () => {
      const { data } = await axios.get('/api/oauth2/client-credentials');
      setClients(data);
    })();
  }, [setClients]);

  return (
    <>
      <HelmetIntl title={messages.title} />
      <Title>
        <FormattedMessage {...messages.title} />
      </Title>
      <p className="content">
        <FormattedMessage {...messages.explanation} />
      </p>
      <Button color="primary" onClick={modal.enable}>
        <FormattedMessage {...messages.register} />
      </Button>
      <Modal
        component={SimpleForm}
        defaultValues={{
          description: '',
          expires: '',
          'blocks:write': false,
          'organizations:styles:write': false,
          'apps:write': false,
        }}
        footer={
          newClientCredentials ? (
            <CardFooterButton onClick={modal.disable}>
              <FormattedMessage {...messages.close} />
            </CardFooterButton>
          ) : (
            <>
              <CardFooterButton onClick={modal.disable}>
                <FormattedMessage {...messages.cancel} />
              </CardFooterButton>
              <CardFooterButton color="primary" type="submit">
                <FormattedMessage {...messages.submit} />
              </CardFooterButton>
            </>
          )
        }
        isActive={modal.enabled}
        onClose={modal.disable}
        onSubmit={registerClient}
        title={<FormattedMessage {...messages.register} />}
      >
        {newClientCredentials ? (
          <Input
            help={<FormattedMessage {...messages.credentialsHelp} />}
            label={<FormattedMessage {...messages.credentials} />}
            name="clientCredentials"
            onChange={null}
            readOnly
            required
            value={newClientCredentials}
          />
        ) : (
          <>
            <SimpleInput
              help={<FormattedMessage {...messages.descriptionHelp} />}
              label={<FormattedMessage {...messages.description} />}
              maxLength={50}
              name="description"
              required
            />
            <SimpleInput<typeof Calendar>
              component={Calendar}
              displayMode="inline"
              help={<FormattedMessage {...messages.expiresHelp} />}
              label={<FormattedMessage {...messages.expires} />}
              name="expires"
              type="date"
            />
            <SimpleInput<typeof Checkbox>
              component={Checkbox}
              help={<FormattedMessage {...messages['blocks:write']} />}
              label="blocks:write"
              name="blocks:write"
            />
            <SimpleInput<typeof Checkbox>
              component={Checkbox}
              help={<FormattedMessage {...messages['organizations:styles:write']} />}
              label="organizations:styles:write"
              name="organizations:styles:write"
            />
            <SimpleInput<typeof Checkbox>
              component={Checkbox}
              help={<FormattedMessage {...messages['apps:write']} />}
              label="apps:write"
              name="apps:write"
            />
          </>
        )}
      </Modal>
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
                        key={scope}
                        className={styles.scope}
                        title={intl.formatMessage(
                          Object.hasOwnProperty.call(messages, scope)
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
