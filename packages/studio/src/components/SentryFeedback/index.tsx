import { Content, SentryForm, Title } from '@appsemble/react-components';
import React, { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { sentryDsn } from '../../utils/settings';
import { useUser } from '../UserProvider';
import { messages } from './messages';

export function SentryFeedback(): ReactElement {
  const { userInfo } = useUser();

  return (
    <Content main>
      <Title level={1}>
        <FormattedMessage {...messages.title} />
      </Title>
      <SentryForm dsn={sentryDsn} email={userInfo?.email} name={userInfo?.name} />
    </Content>
  );
}
