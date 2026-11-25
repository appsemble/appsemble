import { Content, ResetPassword, useMeta, useQuery } from '@appsemble/react-components';
import axios from 'axios';
import { type ReactNode, useCallback } from 'react';
import { useLocation, useResolvedPath } from 'react-router-dom';

import { messages } from './messages.js';

export function ResetPasswordPage(): ReactNode {
  useMeta(messages.title, messages.description);
  const qs = useQuery();
  const location = useLocation();
  const loginPath = useResolvedPath('../login');
  const search = new URLSearchParams(qs);
  search.set('personal', '1');
  const redirect =
    location.search || location.hash
      ? `${loginPath.pathname}?${search}${location.hash}`
      : undefined;

  const onSubmit = useCallback(
    async (email: string): Promise<void> => {
      await axios.post('/api/auth/email/request-password-reset', { email, redirect });
    },
    [redirect],
  );

  return (
    <Content>
      <ResetPassword onSubmit={onSubmit} />
    </Content>
  );
}
