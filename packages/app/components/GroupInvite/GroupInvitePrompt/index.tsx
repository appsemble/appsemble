import { AsyncButton, Message, useData, useQuery } from '@appsemble/react-components';
import { type GroupInvite as GroupInviteType } from '@appsemble/types';
import axios from 'axios';
import { type ReactNode, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useNavigate } from 'react-router-dom';

import { messages } from './messages.js';
import { apiUrl, appId } from '../../../utils/settings.js';
import { useAppMember } from '../../AppMemberProvider/index.js';
import { BuiltinPage, BuiltinPageLoader } from '../../BuiltinPage/index.js';

export function GroupInvitePrompt(): ReactNode {
  const query = useQuery();
  const navigate = useNavigate();

  const { addAppMemberGroup, appMemberInfo, appMemberSelectedGroup, setAppMemberSelectedGroup } =
    useAppMember();

  const [accepted, setAccepted] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const token = query.get('token');

  const {
    data: invite,
    error: inviteError,
    loading,
  } = useData<GroupInviteType>(`${apiUrl}/api/apps/${appId}/group-invites/${token}`);

  const decline = useCallback(async () => {
    try {
      await axios.post(`${apiUrl}/api/apps/${appId}/group-invites/${token}/respond`, {
        response: false,
      });

      setDeclined(true);
    } catch (error_) {
      setError(error_);
    }
  }, [token]);

  const accept = useCallback(async () => {
    try {
      await axios.post(`${apiUrl}/api/apps/${appId}/group-invites/${token}/respond`, {
        response: true,
      });

      // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
      const group = { id: invite.groupId, name: invite.groupName, role: invite.role };

      setAccepted(true);
      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks)
      addAppMemberGroup(group);

      if (!appMemberSelectedGroup) {
        // @ts-expect-error 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks)
        setAppMemberSelectedGroup(group);
      }

      navigate('/');
    } catch (error_) {
      setError(error_);
    }
  }, [
    addAppMemberGroup,
    invite,
    navigate,
    appMemberSelectedGroup,
    setAppMemberSelectedGroup,
    token,
  ]);

  if (loading) {
    return (
      <BuiltinPage page="group-invite" state="loading" title={messages.title}>
        <BuiltinPageLoader />
      </BuiltinPage>
    );
  }

  if (inviteError) {
    return (
      <BuiltinPage narrow page="group-invite" state="error" title={messages.title}>
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

  if (accepted) {
    return (
      <BuiltinPage narrow page="group-invite" state="accepted" title={messages.title}>
        <Message color="success">
          <FormattedMessage
            {...messages.accepted}
            // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
            values={{ groupName: <strong>{invite.groupName}</strong> }}
          />
        </Message>
      </BuiltinPage>
    );
  }

  if (declined) {
    return (
      <BuiltinPage narrow page="group-invite" state="declined" title={messages.title}>
        <Message color="success">
          <FormattedMessage
            {...messages.declined}
            // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
            values={{ groupName: <strong>{invite.groupName}</strong> }}
          />
        </Message>
      </BuiltinPage>
    );
  }

  return (
    <BuiltinPage narrow page="group-invite" state="form" title={messages.title}>
      <p className="content has-text-centered">
        {appMemberInfo.name == null ? (
          <FormattedMessage
            {...messages.descriptionWithoutName}
            values={{
              groupName: <strong>{invite?.groupName}</strong>,
              email: <strong>{appMemberInfo.email}</strong>,
            }}
          />
        ) : (
          <FormattedMessage
            {...messages.description}
            values={{
              groupName: <strong>{invite?.groupName}</strong>,
              name: <strong>{appMemberInfo.name}</strong>,
              email: <strong>{appMemberInfo.email}</strong>,
            }}
          />
        )}
      </p>
      <div className="mt-2 is-flex is-justify-content-space-evenly">
        <AsyncButton color="danger" disabled={accepted || declined} onClick={decline}>
          <FormattedMessage {...messages.decline} />
        </AsyncButton>
        <AsyncButton color="primary" disabled={accepted || declined} onClick={accept}>
          <FormattedMessage {...messages.accept} />
        </AsyncButton>
      </div>
      {error ? (
        <div className="mt-2 is-flex is-justify-content-center">
          {axios.isAxiosError(error) && error.response?.status === 409 ? (
            <FormattedMessage {...messages.emailConflict} />
          ) : (
            <FormattedMessage {...messages.submissionError} />
          )}
        </div>
      ) : null}
    </BuiltinPage>
  );
}
