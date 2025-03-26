import {
  AsyncButton,
  Button,
  CheckboxField,
  Content,
  FormButtons,
  Loader,
  Message,
  PasswordField,
  PasswordStrengthIndicator,
  SelectField,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleSubmit,
  Table,
  Title,
  useConfirmation,
  useData,
  useMessages,
  useMeta,
  useToggle,
} from '@appsemble/react-components';
import { type EmailAuthorization } from '@appsemble/types';
import { defaultLocale, has } from '@appsemble/utils';
import axios from 'axios';
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useMatch, useNavigate } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { ResendEmailButton } from '../../../components/ResendEmailButton/index.js';
import { useUser } from '../../../components/UserProvider/index.js';
import { supportedLanguages } from '../../../utils/constants.js';

export function UserPage(): ReactNode {
  useMeta(messages.title);
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const {
    params: { lang },
    pathname,
  } = useMatch(':lang/settings/user');

  const busy = useToggle();

  const push = useMessages();
  const { refreshUserInfo, userInfo } = useUser();
  const {
    data: emails,
    error,
    loading,
    setData: setEmails,
  } = useData<EmailAuthorization[]>('/api/users/current/emails');
  const timezones = useData<string[]>('/api/timezones');

  const [rerenderKey, setRerenderKey] = useState(0);
  useEffect(() => setRerenderKey((prevKey) => prevKey + 1), [pathname]);

  const onSaveProfile = useCallback(
    async (values: { name: string; locale: string; timezone: string; subscribed: boolean }) => {
      localStorage.setItem('preferredLanguage', values.locale);
      await axios.put('/api/users/current', values);
      refreshUserInfo();
      push({ body: formatMessage(messages.submitSuccess), color: 'success' });
      navigate(pathname.replace(lang, values.locale), { replace: true });
    },
    [formatMessage, navigate, push, refreshUserInfo, lang, pathname],
  );

  const onAddNewEmail = useCallback(
    async (values: { email: string }) => {
      const email = values.email.toLowerCase();
      await axios.post('/api/users/current/emails', { email });
      push({
        body: formatMessage(messages.addEmailSuccess),
        color: 'success',
      });
      setEmails(
        emails
          .concat({ email, verified: false })
          .sort(({ email: a }, { email: b }) => a.localeCompare(b)),
      );
    },
    [emails, formatMessage, push, setEmails],
  );

  const onChangePassword = useCallback(
    async ({ newPassword, password }: { password: string; newPassword: string }) => {
      busy.enable();

      try {
        await axios.post('/api/auth/email/patch-password', {
          newPassword,
          currentPassword: password,
        });
        push({
          body: formatMessage(messages.changePasswordSuccess),
          color: 'success',
        });
      } finally {
        busy.disable();
      }
    },
    [busy, formatMessage, push],
  );

  const setPrimaryEmail = useCallback(
    async (email: string) => {
      await axios.put('/api/users/current', { email });
      refreshUserInfo();
      push({
        body: formatMessage(messages.primaryEmailSuccess, { email }),
        color: 'success',
      });
    },
    [formatMessage, push, refreshUserInfo],
  );

  const deleteEmail = useConfirmation({
    title: <FormattedMessage {...messages.emailWarningTitle} />,
    body: <FormattedMessage {...messages.emailWarning} />,
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: <FormattedMessage {...messages.deleteEmail} />,
    color: 'danger',
    async action(deleting: string) {
      await axios.delete('/api/users/current/emails', { data: { email: deleting } });
      setEmails(emails.filter(({ email }) => email !== deleting));
      push({ body: formatMessage(messages.deleteEmailSuccess), color: 'info' });
    },
  });

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <Content padding>
        <Message color="danger">
          <FormattedMessage {...messages.loadEmailError} />
        </Message>
      </Content>
    );
  }

  return (
    <>
      <Content>
        <Title>
          <FormattedMessage {...messages.profile} />
        </Title>
        <SimpleForm
          defaultValues={{
            name: userInfo.name || '',
            locale: has(supportedLanguages, userInfo.locale?.toLowerCase())
              ? userInfo.locale?.toLowerCase()
              : localStorage.getItem('preferredLanguage') || defaultLocale,
            timezone: userInfo.zoneinfo,
            subscribed: userInfo.subscribed,
          }}
          key={rerenderKey}
          onSubmit={onSaveProfile}
        >
          <SimpleFormError>{() => <FormattedMessage {...messages.submitError} />}</SimpleFormError>
          <SimpleFormField
            help={<FormattedMessage {...messages.displayNameHelp} />}
            icon="user"
            label={<FormattedMessage {...messages.displayName} />}
            name="name"
            placeholder={formatMessage(messages.displayName)}
          />
          <SimpleFormField
            component={SelectField}
            help={<FormattedMessage {...messages.preferredLanguageHelp} />}
            icon="language"
            label={<FormattedMessage {...messages.preferredLanguage} />}
            name="locale"
            required
          >
            {Object.entries(supportedLanguages).map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </SimpleFormField>
          <SimpleFormField
            component={SelectField}
            help={<FormattedMessage {...messages.timezoneHelp} />}
            icon="globe"
            label={<FormattedMessage {...messages.timezone} />}
            loading={timezones.loading}
            name="timezone"
            required
          >
            {timezones.data?.map((timezone) => (
              <option key={timezone} value={timezone}>
                {timezone}
              </option>
            ))}
          </SimpleFormField>
          <SimpleFormField
            component={CheckboxField}
            name="subscribed"
            title={<FormattedMessage {...messages.newsletter} />}
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
        <Title size={4}>
          <FormattedMessage {...messages.emails} />
        </Title>
        <SimpleForm defaultValues={{ email: '' }} onSubmit={onAddNewEmail} resetOnSuccess>
          <SimpleFormError>
            {({ error: submitError }) =>
              axios.isAxiosError(submitError) && submitError.response?.status === 409 ? (
                <FormattedMessage {...messages.addEmailConflict} />
              ) : (
                <FormattedMessage {...messages.addEmailError} />
              )
            }
          </SimpleFormError>
          <SimpleFormField
            icon="envelope"
            label={<FormattedMessage {...messages.addEmail} />}
            name="email"
            placeholder={formatMessage(messages.email)}
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
      {userInfo.hasPassword ? (
        <>
          <hr />
          <Content>
            <Title>
              <FormattedMessage {...messages.passwordLabel} />
            </Title>
            <SimpleForm
              defaultValues={{ password: '', newPassword: '' }}
              onSubmit={onChangePassword}
              resetOnSuccess
            >
              <SimpleFormError>
                {() => <FormattedMessage {...messages.wrongPasswordError} />}
              </SimpleFormError>
              <SimpleFormField
                autoComplete="current-password"
                component={PasswordField}
                disabled={busy.enabled}
                label={<FormattedMessage {...messages.currentPasswordLabel} />}
                minLength={8}
                name="password"
                required
              />
              <SimpleFormField
                autoComplete="new-password"
                component={PasswordField}
                disabled={busy.enabled}
                help={<PasswordStrengthIndicator minLength={8} name="newPassword" />}
                label={<FormattedMessage {...messages.newPasswordLabel} />}
                minLength={8}
                name="newPassword"
                required
              />
              <FormButtons>
                <SimpleSubmit disabled={busy.enabled}>
                  <FormattedMessage {...messages.changePassword} />
                </SimpleSubmit>
              </FormButtons>
            </SimpleForm>
          </Content>
        </>
      ) : null}
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
                <div className="tags is-inline ml-2">
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
                {verified && email !== userInfo.email ? (
                  <Button className="control" color="info" onClick={() => setPrimaryEmail(email)}>
                    <FormattedMessage {...messages.setPrimaryEmail} />
                  </Button>
                ) : null}
                {!verified && <ResendEmailButton className="control is-outlined" email={email} />}
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
