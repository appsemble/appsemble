import { Button } from '@appsemble/preact-components';
import axios from 'axios';
import { type VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import { messages } from './messages.js';
import { FormattedMessage, useIntl } from '../IntlProvider/index.js';
import { useMessages } from '../MessagesProvider/index.js';
import { apiUrl, appId } from '../../utils/settings.js';
import { useAppMember } from '../AppMemberProvider/index.js';

interface ResendVerificationButtonProps {
  readonly className?: string;
}

export function ResendVerificationButton({ className }: ResendVerificationButtonProps): VNode {
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
