import { Message } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { ResendEmailButton } from '../ResendEmailButton';
import { useUser } from '../UserProvider';
import { messages } from './messages';

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
