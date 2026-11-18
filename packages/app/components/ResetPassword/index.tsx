import axios from 'axios';
import { type VNode } from 'preact';
import { useCallback, useState } from 'preact/hooks';
import { Link, useParams } from 'wouter-preact';

import { messages } from './messages.js';
import { FormattedMessage } from '../IntlProvider/index.js';
import { ResetPasswordForm } from '../ResetPasswordForm/index.js';
import { apiUrl, appId } from '../../utils/settings.js';
import { BuiltinPage } from '../BuiltinPage/index.js';

export function ResetPassword(): VNode {
  const [success, setSuccess] = useState(false);
  const onSubmit = useCallback(async (email: string): Promise<void> => {
    await axios.post(`${apiUrl}/api/apps/${appId}/auth/email/request-password-reset`, { email });
    setSuccess(true);
  }, []);
  const { lang } = useParams<{ lang: string }>();

  return (
    <BuiltinPage
      narrow
      page="reset-password"
      showTitle
      state={success ? 'success' : 'form'}
      title={messages.title}
    >
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
