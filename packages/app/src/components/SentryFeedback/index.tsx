import { Content, SentryForm } from '@appsemble/react-components';
import React, { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { sentryDsn } from '../../utils/settings';
import { TitleBar } from '../TitleBar';
import { useUser } from '../UserProvider';
import { messages } from './messages';

export function SentryFeedback(): ReactElement {
  const { userInfo } = useUser();

  return (
    <Content main padding>
      <TitleBar>
        <FormattedMessage {...messages.feedback} />
      </TitleBar>
      <SentryForm dsn={sentryDsn} email={userInfo?.email} name={userInfo?.name} />
    </Content>
  );
}
