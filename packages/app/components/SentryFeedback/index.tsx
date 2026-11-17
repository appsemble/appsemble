import { type ReactNode } from 'react';

import { messages } from './messages.js';
import { FormattedMessage } from '../IntlProvider/index.js';
import { SentryForm } from '../SentryForm/index.js';
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
