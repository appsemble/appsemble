import axios from 'axios';
import { type ReactNode, useCallback, useState } from 'react';
import { Link, Redirect, useParams } from 'wouter-preact';

import { messages } from './messages.js';
import { EditPasswordForm, type EditPasswordValues } from '../EditPasswordForm/index.js';
import { FormattedMessage } from '../IntlProvider/index.js';
import { apiUrl, appId } from '../../utils/settings.js';
import { BuiltinPage } from '../BuiltinPage/index.js';
import { useQuery } from '../../utils/useQuery.js';

export function EditPassword(): ReactNode {
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
    return <Redirect to={`/${lang}`} />;
  }

  return (
    <BuiltinPage
      narrow
      page="edit-password"
      showTitle
      state={success ? 'success' : 'form'}
      title={messages.title}
    >
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
