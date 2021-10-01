import { Content, ResetPassword as ResetPasswordForm, Title } from '@appsemble/react-components';
import axios from 'axios';
import { ReactElement, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, useParams } from 'react-router-dom';

import { apiUrl, appId } from '../../utils/settings';
import { messages } from './messages';

export function ResetPassword(): ReactElement {
  const [success, setSuccess] = useState(false);
  const onSubmit = useCallback(async (email: string): Promise<void> => {
    await axios.post(`${apiUrl}/api/apps/${appId}/member/reset/request`, { email });
    setSuccess(true);
  }, []);
  const { lang } = useParams<{ lang: string }>();

  return (
    <Content padding>
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
