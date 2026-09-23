import { SentryForm } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';
import { sentryDsn } from '../../utils/settings.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { BuiltinPage } from '../BuiltinPage/index.js';

export function SentryFeedback(): ReactNode {
  const { appMemberInfo } = useAppMember();

  return (
    <BuiltinPage
      appBarName={<FormattedMessage {...messages.feedback} />}
      narrow
      page="feedback"
      state="form"
      title={messages.feedback}
    >
      <SentryForm dsn={sentryDsn} email={appMemberInfo?.email} name={appMemberInfo?.name} />
    </BuiltinPage>
  );
}
