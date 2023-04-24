import {
  AsyncButton,
  Content,
  Loader,
  Message,
  useData,
  useQuery,
} from '@appsemble/react-components';
import { type TeamMember } from '@appsemble/types';
import axios from 'axios';
import { type ReactElement, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';
import { apiUrl, appId } from '../../../utils/settings.js';
import { useUser } from '../../UserProvider/index.js';

export function TeamInvitePrompt(): ReactElement {
  const query = useQuery();
  const [isAccepted, setIsAccepted] = useState(false);
  const { updateTeam } = useUser();

  const {
    data: invite,
    error,
    loading,
  } = useData<TeamMember>(`${apiUrl}/api/apps/${appId}/team/invite?${query}`);

  const accept = useCallback(async () => {
    const { data: team } = await axios.post<TeamMember>(`${apiUrl}/api/apps/${appId}/team/invite`, {
      code: query.get('code'),
    });
    setIsAccepted(true);
    updateTeam(team);
  }, [query, updateTeam]);

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
            values={{ teamName: <strong>{invite.name}</strong> }}
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
          values={{ teamName: <strong>{invite.name}</strong> }}
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
