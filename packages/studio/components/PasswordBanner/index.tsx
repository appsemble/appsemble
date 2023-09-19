import { Message } from '@appsemble/react-components';
import axios from 'axios';
import { type ReactNode, useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import { messages } from './messages.js';
import { useUser } from '../UserProvider/index.js';

export function PasswordBanner(): ReactNode {
  const { userInfo } = useUser();
  const [loading, setLoading] = useState<Boolean>(false);
  const [data, setData] = useState<{ password: Boolean; OAuthAuthorizations: boolean }>();
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    setLoading(true);
    axios
      .get<{ password: Boolean; OAuthAuthorizations: boolean }>('/api/user/methods')
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
      });
  }, []);

  if (error || !userInfo || !data || loading) {
    return null;
  }
  if (!data.password && !data.OAuthAuthorizations) {
    return (
      <Message color="warning">
        <div className="is-flex is-justify-content-space-between is-align-items-center">
          <span>
            <FormattedMessage {...messages.setPasswordBanner} />
          </span>
          <span>
            <Link className="mr-2" to="/reset-password">
              <FormattedMessage {...messages.setPasswordButton} />
            </Link>
            <Link className="mr-2" to="/settings/social">
              <FormattedMessage {...messages.socialLoginButton} />
            </Link>
          </span>
        </div>
      </Message>
    );
  }
}
