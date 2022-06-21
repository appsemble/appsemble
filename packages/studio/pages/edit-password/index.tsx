import { Content, EditPassword, useMeta, useQuery } from '@appsemble/react-components';
import axios from 'axios';
import { ReactElement, useCallback } from 'react';
import { Redirect, useParams } from 'react-router-dom';

import { messages } from './messages';

export function EditPasswordPage(): ReactElement {
  useMeta(messages.title);

  const qs = useQuery();
  const token = qs.get('token');
  const { lang } = useParams<{ lang: string }>();
  const onSubmit = useCallback(
    async ({ password }) => {
      await axios.post('/api/email/reset', { token, password });
    },
    [token],
  );

  if (!token) {
    return <Redirect to={`/${lang}/apps`} />;
  }

  return (
    <Content>
      <EditPassword onSubmit={onSubmit} />
    </Content>
  );
}
