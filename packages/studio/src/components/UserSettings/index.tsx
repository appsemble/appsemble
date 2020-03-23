import {
  Button,
  CardFooterButton,
  Modal,
  SimpleForm,
  SimpleFormError,
  SimpleInput,
  SimpleSubmit,
  useMessages,
} from '@appsemble/react-components';
import axios, { AxiosError } from 'axios';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import useUser from '../../hooks/useUser';
import { UserEmail } from '../../types';
import HelmetIntl from '../HelmetIntl';
import styles from './index.css';
import messages from './messages';

export default function UserSettings(): React.ReactElement {
  const intl = useIntl();
  const push = useMessages();
  const { refreshUserInfo, userInfo } = useUser();
  const [emails, setEmails] = React.useState<UserEmail[]>([]);
  const [deleting, setDeleting] = React.useState<string>(null);

  const onSaveProfile = React.useCallback(
    async values => {
      await axios.put('/api/user', values);
      refreshUserInfo();
      push({ body: intl.formatMessage(messages.submitSuccess), color: 'success' });
    },
    [intl, push, refreshUserInfo],
  );

  const onAddNewEmail = React.useCallback(
    async values => {
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

  const onDeleteEmailClick = React.useCallback((email: string) => {
    setDeleting(email);
  }, []);

  const onCloseDeleteDialog = React.useCallback(() => {
    setDeleting(null);
  }, []);

  const deleteEmail = React.useCallback(async () => {
    await axios.delete('/api/user/email', { data: { email: deleting } });

    setEmails(emails.filter(({ email }) => email !== deleting));
    setDeleting(null);
    push({ body: intl.formatMessage(messages.deleteEmailSuccess), color: 'info' });
  }, [deleting, emails, intl, push]);

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
      <div className="content">
        <HelmetIntl title={messages.title} />
        <SimpleForm defaultValues={{ name: userInfo.name || '' }} onSubmit={onSaveProfile}>
          <SimpleFormError>{() => <FormattedMessage {...messages.submitError} />}</SimpleFormError>
          <SimpleInput
            iconLeft="user"
            label={<FormattedMessage {...messages.displayName} />}
            name="name"
            placeholder={intl.formatMessage(messages.displayName)}
          />
          <div className="control">
            <SimpleSubmit>
              <FormattedMessage {...messages.saveProfile} />
            </SimpleSubmit>
          </div>
        </SimpleForm>
        <hr />
        <h4>
          <FormattedMessage {...messages.emails} />
        </h4>
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
          <div className="control">
            <SimpleSubmit>
              <FormattedMessage {...messages.addEmail} />
            </SimpleSubmit>
          </div>
        </SimpleForm>
        <hr />
        <table className="table">
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
                    <Button
                      className="control is-outlined"
                      onClick={() => resendVerification(email)}
                    >
                      <FormattedMessage {...messages.resendVerification} />
                    </Button>
                  )}
                  {email !== userInfo.email && (
                    <Button
                      className="control"
                      color="danger"
                      icon="trash-alt"
                      onClick={() => onDeleteEmailClick(email)}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        className="is-paddingless"
        isActive={!!deleting}
        onClose={onCloseDeleteDialog}
        title={<FormattedMessage {...messages.emailWarningTitle} />}
      >
        <div className={styles.dialogContent}>
          <FormattedMessage {...messages.emailWarning} />
        </div>
        <footer className="card-footer">
          <CardFooterButton onClick={onCloseDeleteDialog}>
            <FormattedMessage {...messages.cancel} />
          </CardFooterButton>
          <CardFooterButton color="danger" onClick={deleteEmail}>
            <FormattedMessage {...messages.deleteEmail} />
          </CardFooterButton>
        </footer>
      </Modal>
    </>
  );
}
