import {
  Content,
  ResetPassword as ResetPasswordForm,
  Title,
  useMeta,
} from '@appsemble/react-components';
import axios from 'axios';
import { type ReactNode, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, useParams } from 'react-router-dom';

import { messages } from './messages.js';
import { apiUrl, appId } from '../../utils/settings.js';
import { AppBar } from '../TitleBar/index.js';

export function ResetPassword(): ReactNode {
  useMeta(messages.title);

  const [success, setSuccess] = useState(false);
  const onSubmit = useCallback(async (email: string): Promise<void> => {
    await axios.post(`${apiUrl}/api/apps/${appId}/auth/email/request-password-reset`, { email });
    setSuccess(true);
  }, []);
  const { lang } = useParams<{ lang: string }>();

  return (
    <Content padding>
      <AppBar />
      <Title>
        <FormattedMessage {...messages.title} />
      </Title>
      <ResetPasswordForm onSubmit={onSubmit} />
      {success ? (
        <div className="my-4 is-flex is-justify-content-center">
          <Link className="button is-success" to={`/${lang}`}>
            <FormattedMessage {...messages.returnToApp} />
          </Link>
        </div>
      ) : null}
    </Content>
  );
}
