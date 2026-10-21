import {
  AsyncButton,
  Button,
  Message,
  PasswordField,
  PasswordStrengthIndicator,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleSubmit,
  useData,
  useQuery,
} from '@appsemble/react-components';
import { type AppInvite as AppInviteType, type AppMemberInfo } from '@appsemble/types';
import { timezone } from '@appsemble/web-utils';
import axios from 'axios';
import { type ReactNode, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useNavigate, useParams } from 'react-router-dom';

import { messages } from './messages.js';
import { apiUrl, appId } from '../../utils/settings.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { useAppMessages } from '../AppMessagesProvider/index.js';
import { BuiltinPage, BuiltinPageLoader } from '../BuiltinPage/index.js';

interface AppInviteFormProps {
  readonly password: string;

  readonly accepted: boolean;
}

export function AppInvite(): ReactNode {
  const query = useQuery();

  const { definition } = useAppDefinition();
  const { passwordLogin } = useAppMember();
  const { getAppMessage } = useAppMessages();
  const navigate = useNavigate();
  const { lang } = useParams<{ lang: string }>();

  const [accepted, setAccepted] = useState(false);
  const [declined, setDeclined] = useState(false);

  const { appMemberInfo, logout } = useAppMember();

  const appName = (getAppMessage({ id: 'name' }).format() as string) ?? definition.name;

  const token = query.get('token');

  const {
    data: invite,
    error: inviteError,
    loading,
  } = useData<AppInviteType>(`${apiUrl}/api/apps/${appId}/app-invites/${token}`);

  const decline = useCallback(async () => {
    await axios.post<AppMemberInfo>(`${apiUrl}/api/apps/${appId}/app-invites/${token}/respond`, {
      response: false,
    });
    setDeclined(true);
  }, [token]);

  const accept = useCallback(
    async (props: AppInviteFormProps) => {
      await axios.post<AppMemberInfo>(`${apiUrl}/api/apps/${appId}/app-invites/${token}/respond`, {
        timezone,
        locale: lang,
        response: true,
        password: props.password,
      });
      setAccepted(true);
      // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
      await passwordLogin({ username: invite.email, password: props.password });
      navigate('/');
    },
    [invite, lang, navigate, passwordLogin, token],
  );

  if (loading) {
    return (
      <BuiltinPage page="app-invite" state="loading" title={messages.title}>
        <BuiltinPageLoader />
      </BuiltinPage>
    );
  }

  if (inviteError) {
    return (
      <BuiltinPage narrow page="app-invite" state="error" title={messages.title}>
        <Message color="danger">
          {inviteError.response?.status === 404 ? (
            <FormattedMessage {...messages.notFound} />
          ) : (
            <FormattedMessage {...messages.inviteLoadingError} />
          )}
        </Message>
      </BuiltinPage>
    );
  }

  if (accepted || declined) {
    return (
      <BuiltinPage
        narrow
        page="app-invite"
        state={accepted ? 'accepted' : 'declined'}
        title={messages.title}
      >
        <Message color="success">
          <FormattedMessage
            {...(accepted ? messages.accepted : messages.declined)}
            values={{ appName: <strong>{appName}</strong> }}
          />
        </Message>
      </BuiltinPage>
    );
  }

  if (appMemberInfo) {
    return (
      <BuiltinPage narrow page="app-invite" state="member" title={messages.title}>
        <Message color="danger">
          <FormattedMessage
            {...messages.alreadyMember}
            values={{ username: <strong>{appMemberInfo.name}</strong> }}
          />
        </Message>
        <Button color="primary" onClick={() => logout()}>
          <FormattedMessage {...messages.logout} />
        </Button>
      </BuiltinPage>
    );
  }

  return (
    <BuiltinPage narrow page="app-invite" state="form" title={messages.title}>
      <p className="content has-text-centered">
        <FormattedMessage
          {...messages.description}
          values={{ appName: <strong>{appName}</strong> }}
        />
      </p>
      <p className="content has-text-centered">
        <FormattedMessage {...messages.setPassword} />
      </p>
      <SimpleForm defaultValues={{ password: '', accepted: false }} onSubmit={accept}>
        <SimpleFormField disabled value={invite?.email} />
        <SimpleFormField
          autoComplete="new-password"
          component={PasswordField}
          help={<PasswordStrengthIndicator minLength={8} name="password" />}
          label={<FormattedMessage {...messages.passwordLabel} />}
          minLength={8}
          name="password"
          required
        />
        <div className="mt-2 is-flex is-justify-content-space-between">
          <AsyncButton color="danger" disabled={accepted || declined} onClick={decline}>
            <FormattedMessage {...messages.decline} />
          </AsyncButton>
          <SimpleSubmit color="primary" disabled={accepted || declined}>
            <FormattedMessage {...messages.accept} />
          </SimpleSubmit>
        </div>
        <SimpleFormError>
          {({ error }) =>
            axios.isAxiosError(error) && error.response?.status === 409 ? (
              <FormattedMessage {...messages.emailConflict} />
            ) : (
              <FormattedMessage {...messages.submissionError} />
            )
          }
        </SimpleFormError>
      </SimpleForm>
    </BuiltinPage>
  );
}
