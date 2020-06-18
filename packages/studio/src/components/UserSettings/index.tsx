import {
  Button,
  Content,
  FormButtons,
  SimpleForm,
  SimpleFormError,
  SimpleInput,
  SimpleSubmit,
  Table,
  Title,
  useConfirmation,
  useMessages,
} from '@appsemble/react-components';
import axios, { AxiosError } from 'axios';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import useUser from '../../hooks/useUser';
import type { UserEmail } from '../../types';
import AsyncButton from '../AsyncButton';
import HelmetIntl from '../HelmetIntl';
import styles from './index.css';
import messages from './messages';

export default function UserSettings(): React.ReactElement {
  const intl = useIntl();
  const push = useMessages();
  const { refreshUserInfo, userInfo } = useUser();
  const [emails, setEmails] = React.useState<UserEmail[]>([]);

  const onSaveProfile = React.useCallback(
    async (values) => {
      await axios.put('/api/user', values);
      refreshUserInfo();
      push({ body: intl.formatMessage(messages.submitSuccess), color: 'success' });
    },
    [intl, push, refreshUserInfo],
  );

  const onAddNewEmail = React.useCallback(
    async (values) => {
      await axios.post('/api/user/email', values);
      push({
        body: intl.formatMessage(messages.addEmailSuccess),
        color: 'success',
      });
      setEmails(
        emails
          .concat({ ...values, verified: false })
          .sort(({ email: a }, { email: b }) => a.localeCompare(b)),
      );
    },
    [emails, intl, push],
  );

  const setPrimaryEmail = React.useCallback(
    async (email: string) => {
      await axios.put('/api/user', { email });
      refreshUserInfo();
      push({
        body: intl.formatMessage(messages.primaryEmailSuccess, { email }),
        color: 'success',
      });
    },
    [intl, push, refreshUserInfo],
  );

  const resendVerification = React.useCallback(
    async (email: string) => {
      await axios.post('/api/email/resend', { email });
      push({
        body: intl.formatMessage(messages.resendVerificationSent),
        color: 'info',
      });
    },
    [intl, push],
  );

  const deleteEmail = useConfirmation({
    title: <FormattedMessage {...messages.emailWarningTitle} />,
    body: <FormattedMessage {...messages.emailWarning} />,
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: <FormattedMessage {...messages.deleteEmail} />,
    color: 'danger',
    async action(deleting: string) {
      await axios.delete('/api/user/email', { data: { email: deleting } });
      setEmails(emails.filter(({ email }) => email !== deleting));
      push({ body: intl.formatMessage(messages.deleteEmailSuccess), color: 'info' });
    },
  });

  React.useEffect(() => {
    axios.get('/api/user/email').then(
      ({ data }) => {
        setEmails(data);
      },
      () => {
        push({
          body: intl.formatMessage(messages.loadEmailError),
          color: 'danger',
        });
      },
    );
  }, [intl, push]);

  return (
    <>
      <HelmetIntl title={messages.title} />
      <Content>
        <Title>
          <FormattedMessage {...messages.profile} />
        </Title>
        <SimpleForm defaultValues={{ name: userInfo.name || '' }} onSubmit={onSaveProfile}>
          <SimpleFormError>{() => <FormattedMessage {...messages.submitError} />}</SimpleFormError>
          <SimpleInput
            help={<FormattedMessage {...messages.displayNameHelp} />}
            iconLeft="user"
            label={<FormattedMessage {...messages.displayName} />}
            name="name"
            placeholder={intl.formatMessage(messages.displayName)}
          />
          <FormButtons>
            <SimpleSubmit>
              <FormattedMessage {...messages.saveProfile} />
            </SimpleSubmit>
          </FormButtons>
        </SimpleForm>
      </Content>
      <hr />
      <Content>
        <Title>
          <FormattedMessage {...messages.emails} />
        </Title>
        <SimpleForm defaultValues={{ email: '' }} onSubmit={onAddNewEmail} resetOnSuccess>
          <SimpleFormError>
            {({ error }) =>
              (error as AxiosError)?.response?.status === 409 ? (
                <FormattedMessage {...messages.addEmailConflict} />
              ) : (
                <FormattedMessage {...messages.addEmailError} />
              )
            }
          </SimpleFormError>
          <SimpleInput
            iconLeft="envelope"
            label={<FormattedMessage {...messages.addEmail} />}
            name="email"
            placeholder={intl.formatMessage(messages.email)}
            required
            type="email"
          />
          <FormButtons>
            <SimpleSubmit>
              <FormattedMessage {...messages.addEmail} />
            </SimpleSubmit>
          </FormButtons>
        </SimpleForm>
      </Content>
      <hr />
      <Table>
        <thead>
          <tr>
            <th>
              <FormattedMessage {...messages.email} />
            </th>
            <th className="has-text-right">
              <FormattedMessage {...messages.actions} />
            </th>
          </tr>
        </thead>
        <tbody>
          {emails.map(({ email, verified }) => (
            <tr key={email}>
              <td>
                <span>{email}</span>
                <div className={`tags ${styles.tags}`}>
                  {email === userInfo.email && (
                    <span className="tag is-primary">
                      <FormattedMessage {...messages.primary} />
                    </span>
                  )}
                  {verified ? (
                    <span className="tag is-success">
                      <FormattedMessage {...messages.verified} />
                    </span>
                  ) : (
                    <span className="tag is-warning">
                      <FormattedMessage {...messages.unverified} />
                    </span>
                  )}
                </div>
              </td>
              <td className={`has-text-right ${styles.buttonGroup}`}>
                {verified && email !== userInfo.email && (
                  <Button className="control" color="info" onClick={() => setPrimaryEmail(email)}>
                    <FormattedMessage {...messages.setPrimaryEmail} />
                  </Button>
                )}
                {!verified && (
                  <Button className="control is-outlined" onClick={() => resendVerification(email)}>
                    <FormattedMessage {...messages.resendVerification} />
                  </Button>
                )}
                {email !== userInfo.email && (
                  <AsyncButton
                    className="control"
                    color="danger"
                    icon="trash-alt"
                    onClick={() => deleteEmail(email)}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
