import { Content, ResetPassword, useMeta } from '@appsemble/react-components';
import axios from 'axios';
import { type ReactNode, useCallback } from 'react';

import { messages } from './messages.js';

export function ResetPasswordPage(): ReactNode {
  useMeta(messages.title, messages.description);

  const onSubmit = useCallback(async (email: string): Promise<void> => {
    await axios.post('/api/email/reset/request', { email });
  }, []);

  return (
    <Content>
      <ResetPassword onSubmit={onSubmit} />
    </Content>
  );
}
