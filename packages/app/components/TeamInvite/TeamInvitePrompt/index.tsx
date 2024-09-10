import {
  AsyncButton,
  Content,
  Loader,
  Message,
  useData,
  useQuery,
} from '@appsemble/react-components';
import { type GroupMember } from '@appsemble/types';
import axios from 'axios';
import { type ReactNode, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';
import { apiUrl, appId } from '../../../utils/settings.js';
import { useAppMember } from '../../AppMemberProvider/index.js';

export function GroupInvitePrompt(): ReactNode {
  const query = useQuery();
  const [isAccepted, setIsAccepted] = useState(false);
  const { updateGroup } = useAppMember();

  const {
    data: invite,
    error,
    loading,
  } = useData<GroupMember>(`${apiUrl}/api/apps/${appId}/group/invites?${query}`);

  const accept = useCallback(async () => {
    const { data: group } = await axios.post<GroupMember>(
      `${apiUrl}/api/apps/${appId}/group/invites`,
      {
        code: query.get('code'),
      },
    );
    setIsAccepted(true);
    updateGroup(group);
  }, [query, updateGroup]);

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <Content padding>
        <Message color="danger">
          {error.response.status === 404 ? (
            <FormattedMessage {...messages.notFound} />
          ) : (
            <FormattedMessage {...messages.error} />
          )}
        </Message>
      </Content>
    );
  }

  if (isAccepted) {
    return (
      <Content padding>
        <Message color="success">
          <FormattedMessage
            {...messages.accepted}
            values={{ groupName: <strong>{invite.name}</strong> }}
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
          values={{ groupName: <strong>{invite.name}</strong> }}
        />
      </p>
      <div className="is-flex is-justify-content-center">
        <AsyncButton color="primary" disabled={isAccepted} onClick={accept}>
          <FormattedMessage {...messages.accept} />
        </AsyncButton>
      </div>
    </Content>
  );
}
