import { Content, SentryForm, useMeta } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';
import { sentryDsn } from '../../utils/settings.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { AppBar } from '../TitleBar/index.js';

export function SentryFeedback(): ReactNode {
  useMeta(messages.feedback);
  const { appMemberInfo } = useAppMember();

  return (
    <Content main padding>
      <AppBar>
        <FormattedMessage {...messages.feedback} />
      </AppBar>
      <SentryForm dsn={sentryDsn} email={appMemberInfo?.email} name={appMemberInfo?.name} />
    </Content>
  );
}
