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
} from '@appsemble/react-components';
import { scopes as knownScopes } from '@appsemble/utils';
import axios from 'axios';
import * as React from 'react';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';

import { OAuth2ClientCredentials } from '../../types';
import styles from './index.css';
import messages from './messages';
import scopeDescriptions from './scopeDescriptions';

export default function ClientCredentials(): React.ReactElement {
  const intl = useIntl();
  const [clients, setClients] = React.useState<OAuth2ClientCredentials[]>([]);
  const [newClientCredentials, setNewClientCredentials] = React.useState<string>(null);
  const [isModalActive, setModalActive] = React.useState(false);
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
  const openModal = React.useCallback(() => {
    setModalActive(true);
  }, []);
  const closeModal = React.useCallback(() => {
    setModalActive(false);
  }, []);
  const onDelete = React.useCallback(
    (client: OAuth2ClientCredentials) => async () => {
      await axios.delete(`/api/oauth2/client-credentials/${client.id}`);
      setClients(clients.filter(c => c.id !== client.id));
    },
    [clients],
  );
  React.useEffect(() => {
    (async () => {
      const { data } = await axios.get('/api/oauth2/client-credentials');
      setClients(data);
    })();
  }, [setClients]);

  return (
    <div>
      <p className="content">
        <FormattedMessage {...messages.explanation} />
      </p>
      <Button color="primary" onClick={openModal}>
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
          <>
            <CardFooterButton onClick={closeModal}>
              <FormattedMessage {...messages.cancel} />
            </CardFooterButton>
            <CardFooterButton color="primary" type="submit">
              <FormattedMessage {...messages.submit} />
            </CardFooterButton>
          </>
        }
        isActive={isModalActive}
        onClose={closeModal}
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
              help={<FormattedMessage {...scopeDescriptions['blocks:write']} />}
              label="blocks:write"
              name="blocks:write"
            />
            <SimpleInput<typeof Checkbox>
              component={Checkbox}
              help={<FormattedMessage {...scopeDescriptions['organizations:styles:write']} />}
              label="organizations:styles:write"
              name="organizations:styles:write"
            />
            <SimpleInput<typeof Checkbox>
              component={Checkbox}
              help={<FormattedMessage {...scopeDescriptions['apps:write']} />}
              label="apps:write"
              name="apps:write"
            />
          </>
        )}
      </Modal>
      {clients.length ? (
        <div className="table-container">
          <table className={`table is-narrow is-fullwidth is-hoverable ${styles.table}`}>
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
              {clients.map(client => (
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
                      {client.scopes.map(scope => (
                        <data
                          key={scope}
                          className={styles.scope}
                          title={intl.formatMessage(
                            Object.hasOwnProperty.call(scopeDescriptions, scope)
                              ? scopeDescriptions[scope as keyof typeof scopeDescriptions]
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
                    <Button className="is-pulled-right" color="danger" onClick={onDelete(client)}>
                      <FormattedMessage {...messages.revoke} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>
          <FormattedMessage {...messages.empty} />
        </p>
      )}
    </div>
  );
}
