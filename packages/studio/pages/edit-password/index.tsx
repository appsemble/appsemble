import {
  Content,
  EditPassword,
  type EditPasswordValues,
  useMeta,
  useQuery,
} from '@appsemble/react-components';
import axios from 'axios';
import { type ReactNode, useCallback } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { messages } from './messages.js';
import { isLocalRedirect } from '../../utils/isLocalRedirect.js';

export function EditPasswordPage(): ReactNode {
  useMeta(messages.title);

  const qs = useQuery();
  const navigate = useNavigate();
  const token = qs.get('token');
  const redirect = qs.get('redirect');
  const onSubmit = useCallback(
    async ({ password }: EditPasswordValues) => {
      await axios.post('/api/auth/email/reset-password', { token, password });
      if (isLocalRedirect(redirect)) {
        navigate(redirect, { replace: true });
      }
    },
    [navigate, redirect, token],
  );

  if (!token) {
    return <Navigate to="/apps" />;
  }

  return (
    <Content>
      <EditPassword onSubmit={onSubmit} />
    </Content>
  );
}
