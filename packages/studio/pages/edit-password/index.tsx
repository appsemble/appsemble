import {
  Content,
  EditPassword,
  type EditPasswordValues,
  useMeta,
  useQuery,
} from '@appsemble/react-components';
import axios from 'axios';
import { type ReactElement, useCallback } from 'react';
import { Navigate, useParams } from 'react-router-dom';

import { messages } from './messages.js';

export function EditPasswordPage(): ReactElement {
  useMeta(messages.title);

  const qs = useQuery();
  const token = qs.get('token');
  const { lang } = useParams<{ lang: string }>();
  const onSubmit = useCallback(
    async ({ password }: EditPasswordValues) => {
      await axios.post('/api/email/reset', { token, password });
    },
    [token],
  );

  if (!token) {
    return <Navigate to={`/${lang}/apps`} />;
  }

  return (
    <Content>
      <EditPassword onSubmit={onSubmit} />
    </Content>
  );
}
