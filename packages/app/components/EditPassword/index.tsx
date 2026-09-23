import {
  EditPassword as EditPasswordForm,
  type EditPasswordValues,
  Title,
  useQuery,
} from '@appsemble/react-components';
import axios from 'axios';
import { type ReactNode, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, Navigate, useParams } from 'react-router-dom';

import { messages } from './messages.js';
import { apiUrl, appId } from '../../utils/settings.js';
import { BuiltinPage, useBuiltinPageTitleArea } from '../BuiltinPage/index.js';

export function EditPassword(): ReactNode {
  const [success, setSuccess] = useState(false);
  const qs = useQuery();
  const token = qs.get('token');
  const { lang } = useParams<{ lang: string }>();
  const hasTitleArea = useBuiltinPageTitleArea();
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
    <BuiltinPage
      narrow
      page="edit-password"
      state={success ? 'success' : 'form'}
      title={messages.title}
    >
      {hasTitleArea ? null : (
        <Title>
          <FormattedMessage {...messages.title} />
        </Title>
      )}
      <EditPasswordForm onSubmit={onSubmit} />
      {success ? (
        <div className="is-flex is-justify-content-center">
          <Link className="button is-primary" to={`/${lang}`}>
            <FormattedMessage {...messages.returnToApp} />
          </Link>
        </div>
      ) : null}
    </BuiltinPage>
  );
}
