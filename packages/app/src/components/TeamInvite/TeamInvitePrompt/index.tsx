import {
  AsyncButton,
  Content,
  Loader,
  Message,
  useData,
  useQuery,
} from '@appsemble/react-components';
import { TeamMember } from '@appsemble/types';
import axios from 'axios';
import { ReactElement, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { apiUrl, appId } from '../../../utils/settings';
import { messages } from './messages';

export function TeamInvitePrompt(): ReactElement {
  const query = useQuery();
  const [isAccepted, setIsAccepted] = useState(false);

  const {
    data: invite,
    error,
    loading,
  } = useData<TeamMember>(`${apiUrl}/api/apps/${appId}/team/invite?${query}`);

  const accept = useCallback(async () => {
    await axios.post(`${apiUrl}/api/apps/${appId}/team/invite`, { code: query.get('code') });
    setIsAccepted(true);
  }, [query]);

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
    <Content>
      <p className="content">
        <FormattedMessage
          {...messages.description}
          values={{ teamName: <strong>{invite.name}</strong> }}
        />
      </p>
      <AsyncButton color="primary" disabled={isAccepted} onClick={accept}>
        <FormattedMessage {...messages.accept} />
      </AsyncButton>
    </Content>
  );
}
