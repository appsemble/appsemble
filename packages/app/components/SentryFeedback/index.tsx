import { Content, SentryForm, useMeta } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { sentryDsn } from '../../utils/settings.js';
import { AppBar } from '../TitleBar/index.js';
import { useUser } from '../UserProvider/index.js';
import { messages } from './messages.js';

export function SentryFeedback(): ReactElement {
  useMeta(messages.feedback);
  const { userInfo } = useUser();

  return (
    <Content main padding>
      <AppBar>
        <FormattedMessage {...messages.feedback} />
      </AppBar>
      <SentryForm dsn={sentryDsn} email={userInfo?.email} name={userInfo?.name} />
    </Content>
  );
}
