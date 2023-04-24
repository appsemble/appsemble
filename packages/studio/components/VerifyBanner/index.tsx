import { Message } from '@appsemble/react-components';
import { type ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';
import { ResendEmailButton } from '../ResendEmailButton/index.js';
import { useUser } from '../UserProvider/index.js';

export function VerifyBanner(): ReactElement {
  const { userInfo } = useUser();

  if (!userInfo || userInfo.email_verified) {
    return null;
  }

  return (
    <Message color="warning">
      <div className="is-flex is-justify-content-space-between is-align-items-center">
        <span>
          <FormattedMessage values={{ email: userInfo.email }} {...messages.verifyEmail} />
        </span>
        <ResendEmailButton email={userInfo.email} />
      </div>
    </Message>
  );
}
