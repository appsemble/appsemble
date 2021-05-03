import { Button, useMessages } from '@appsemble/react-components';
import axios from 'axios';
import { ComponentProps, ReactElement, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { messages } from './messages';

interface ResendEmailButtonProps extends ComponentProps<typeof Button> {
  email: string;
}

export function ResendEmailButton({ email, ...props }: ResendEmailButtonProps): ReactElement {
  const { formatMessage } = useIntl();
  const push = useMessages();

  const resendVerification = useCallback(async () => {
    await axios.post('/api/email/resend', { email });
    push({
      body: formatMessage(messages.resendVerificationSent),
      color: 'info',
    });
  }, [email, formatMessage, push]);

  return (
    <Button {...props} onClick={resendVerification}>
      <FormattedMessage {...messages.resendVerification} />
    </Button>
  );
}
