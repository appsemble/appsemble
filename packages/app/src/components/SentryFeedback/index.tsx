import { Content, SentryForm, useMeta } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { sentryDsn } from '../../utils/settings';
import { TitleBar } from '../TitleBar';
import { useUser } from '../UserProvider';
import { messages } from './messages';

export function SentryFeedback(): ReactElement {
  useMeta(messages.feedback);
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
