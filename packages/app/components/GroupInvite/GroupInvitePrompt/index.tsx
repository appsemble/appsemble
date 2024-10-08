import {
  AsyncButton,
  Content,
  Loader,
  Message,
  useData,
  useQuery,
} from '@appsemble/react-components';
import { type GroupInvite as GroupInviteType } from '@appsemble/types';
import axios from 'axios';
import { type ReactNode, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useNavigate } from 'react-router-dom';

import { messages } from './messages.js';
import { apiUrl } from '../../../utils/settings.js';
import { useAppMember } from '../../AppMemberProvider/index.js';

export function GroupInvitePrompt(): ReactNode {
  const query = useQuery();
  const navigate = useNavigate();

  const { addAppMemberGroup, appMemberSelectedGroup, setAppMemberSelectedGroup } = useAppMember();

  const [accepted, setAccepted] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [error, setError] = useState(null);

  const token = query.get('token');

  const {
    data: invite,
    error: inviteError,
    loading,
  } = useData<GroupInviteType>(`${apiUrl}/api/group-invites/${token}`);

  const decline = useCallback(async () => {
    try {
      await axios.post(`${apiUrl}/api/group-invites/${token}/respond`, { response: false });

      setDeclined(true);
    } catch (error_) {
      setError(error_);
    }
  }, [token]);

  const accept = useCallback(async () => {
    try {
      await axios.post(`${apiUrl}/api/group-invites/${token}/respond`, { response: true });

      const group = { id: invite.groupId, name: invite.groupName, role: invite.role };

      setAccepted(true);
      addAppMemberGroup(group);

      if (!appMemberSelectedGroup) {
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
    return <Loader />;
  }

  if (inviteError) {
    return (
      <Content padding>
        <Message color="danger">
          {inviteError.response.status === 404 ? (
            <FormattedMessage {...messages.notFound} />
          ) : (
            <FormattedMessage {...messages.inviteLoadingError} />
          )}
        </Message>
      </Content>
    );
  }

  if (accepted) {
    return (
      <Content padding>
        <Message color="success">
          <FormattedMessage
            {...messages.accepted}
            values={{ groupName: <strong>{invite.groupName}</strong> }}
          />
        </Message>
      </Content>
    );
  }

  if (declined) {
    return (
      <Content padding>
        <Message color="success">
          <FormattedMessage
            {...messages.declined}
            values={{ groupName: <strong>{invite.groupName}</strong> }}
          />
        </Message>
      </Content>
    );
  }

  return (
    <Content padding>
      <p className="content has-text-centered">
        <FormattedMessage
          {...messages.description}
          values={{ groupName: <strong>{invite.groupName}</strong> }}
        />
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
          {axios.isAxiosError(error) && error.response.status === 409 ? (
            <FormattedMessage {...messages.emailConflict} />
          ) : (
            <FormattedMessage {...messages.submissionError} />
          )}
        </div>
      ) : null}
    </Content>
  );
}
