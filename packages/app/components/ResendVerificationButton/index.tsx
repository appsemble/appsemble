import { Button, useMessages } from '@appsemble/react-components';
import axios from 'axios';
import { type ReactNode, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { messages } from './messages.js';
import { apiUrl, appId } from '../../utils/settings.js';
import { useAppMember } from '../AppMemberProvider/index.js';

interface ResendVerificationButtonProps {
  readonly className?: string;
}

export function ResendVerificationButton({ className }: ResendVerificationButtonProps): ReactNode {
  const { appMemberInfo } = useAppMember();
  const push = useMessages();
  const { formatMessage } = useIntl();
  const onClickResend = useCallback(async () => {
    try {
      await axios.post(`${apiUrl}/api/apps/${appId}/auth/email/resend-verification`, {
        email: appMemberInfo.unverifiedEmail ?? appMemberInfo.email,
      });
      push({
        body: formatMessage(messages.resendVerificationSent),
        color: 'info',
      });
    } catch {
      push({ body: formatMessage(messages.resendVerificationError), color: 'danger' });
    }
  }, [appMemberInfo, formatMessage, push]);

  return (
    <Button className={className} onClick={onClickResend}>
      <FormattedMessage {...messages.resendVerification} />
    </Button>
  );
}
