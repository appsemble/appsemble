import { ResetPassword as ResetPasswordForm, Title } from '@appsemble/react-components';
import axios from 'axios';
import { type ReactNode, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, useParams } from 'react-router-dom';

import { messages } from './messages.js';
import { apiUrl, appId } from '../../utils/settings.js';
import { BuiltinPage, useBuiltinPageTitleArea } from '../BuiltinPage/index.js';

export function ResetPassword(): ReactNode {
  const [success, setSuccess] = useState(false);
  const onSubmit = useCallback(async (email: string): Promise<void> => {
    await axios.post(`${apiUrl}/api/apps/${appId}/auth/email/request-password-reset`, { email });
    setSuccess(true);
  }, []);
  const { lang } = useParams<{ lang: string }>();
  const hasTitleArea = useBuiltinPageTitleArea();

  return (
    <BuiltinPage
      narrow
      page="reset-password"
      state={success ? 'success' : 'form'}
      title={messages.title}
    >
      {hasTitleArea ? null : (
        <Title>
          <FormattedMessage {...messages.title} />
        </Title>
      )}
      <ResetPasswordForm onSubmit={onSubmit} />
      {success ? (
        <div className="my-4 is-flex is-justify-content-center">
          <Link className="button is-success" to={`/${lang}`}>
            <FormattedMessage {...messages.returnToApp} />
          </Link>
        </div>
      ) : null}
    </BuiltinPage>
  );
}
