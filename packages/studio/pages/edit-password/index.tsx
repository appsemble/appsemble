import {
  Content,
  EditPassword,
  type EditPasswordValues,
  useMeta,
  useQuery,
} from '@appsemble/react-components';
import axios from 'axios';
import { type ReactNode, useCallback } from 'react';
import { Navigate } from 'react-router-dom';

import { messages } from './messages.js';

export function EditPasswordPage(): ReactNode {
  useMeta(messages.title);

  const qs = useQuery();
  const token = qs.get('token');
  const onSubmit = useCallback(
    async ({ password }: EditPasswordValues) => {
      await axios.post('/api/auth/email/reset-password', { token, password });
    },
    [token],
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
