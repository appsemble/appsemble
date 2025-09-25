import { Message } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { ResendVerificationButton } from '../ResendVerificationButton/index.js';

export function VerifyBanner(): ReactNode {
  const { appMemberInfo } = useAppMember();

  if (!appMemberInfo || appMemberInfo.email_verified) {
    return null;
  }

  return (
    <Message color="warning">
      <div className="is-flex is-justify-content-space-between is-align-items-center">
        <span>
          <FormattedMessage values={{ email: appMemberInfo.email }} {...messages.verifyEmail} />
        </span>
        <ResendVerificationButton />
      </div>
    </Message>
  );
}
