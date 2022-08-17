import { Content, SentryForm, Title, useMeta } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { useUser } from '../../components/UserProvider/index.js';
import { sentryDsn } from '../../utils/settings.js';
import { messages } from './messages.js';

export function FeedbackPage(): ReactElement {
  const { userInfo } = useUser();
  useMeta(messages.title, messages.description);

  return (
    <Content main>
      <Title>
        <FormattedMessage {...messages.title} />
      </Title>
      <SentryForm dsn={sentryDsn} email={userInfo?.email} name={userInfo?.name} />
    </Content>
  );
}
