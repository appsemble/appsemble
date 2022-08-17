import { Button, useMessages } from '@appsemble/react-components';
import axios from 'axios';
import { ComponentProps, ReactElement, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { messages } from './messages.js';

interface ResendEmailButtonProps extends ComponentProps<typeof Button> {
  /**
   * The email address to send the email verification to.
   */
  email: string;
}

/**
 * Render a button that can be used to resend verification emails.
 */
export function ResendEmailButton({ email, ...props }: ResendEmailButtonProps): ReactElement {
  const { formatMessage } = useIntl();
  const push = useMessages();

  const resendVerification = useCallback(async () => {
    try {
      await axios.post('/api/email/resend', { email });
      push({
        body: formatMessage(messages.resendVerificationSent),
        color: 'info',
      });
    } catch {
      push({ body: formatMessage(messages.resendVerificationError), color: 'danger' });
    }
  }, [email, formatMessage, push]);

  return (
    <Button {...props} onClick={resendVerification}>
      <FormattedMessage {...messages.resendVerification} />
    </Button>
  );
}
