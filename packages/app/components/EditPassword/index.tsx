import {
  Content,
  EditPassword as EditPasswordForm,
  type EditPasswordValues,
  Title,
  useMeta,
  useQuery,
} from '@appsemble/react-components';
import axios from 'axios';
import { type ReactNode, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, Navigate, useParams } from 'react-router-dom';

import { messages } from './messages.js';
import { apiUrl, appId } from '../../utils/settings.js';

export function EditPassword(): ReactNode {
  useMeta(messages.title);

  const [success, setSuccess] = useState(false);
  const qs = useQuery();
  const token = qs.get('token');
  const { lang } = useParams<{ lang: string }>();
  const onSubmit = useCallback(
    async ({ password }: EditPasswordValues) => {
      await axios.post(`${apiUrl}/api/apps/${appId}/auth/email/reset-password`, {
        token,
        password,
      });
      setSuccess(true);
    },
    [token],
  );

  if (!token) {
    return <Navigate to={`/${lang}`} />;
  }

  return (
    <Content padding>
      <Title>
        <FormattedMessage {...messages.title} />
      </Title>
      <EditPasswordForm onSubmit={onSubmit} />
      {success ? (
        <div className="is-flex is-justify-content-center">
          <Link className="button is-primary" to={`/${lang}`}>
            <FormattedMessage {...messages.returnToApp} />
          </Link>
        </div>
      ) : null}
    </Content>
  );
}
