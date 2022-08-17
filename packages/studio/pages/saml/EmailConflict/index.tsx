import {
  AsyncButton,
  Button,
  Content,
  FormButtons,
  Loader,
  useLocationString,
  useMessages,
  useQuery,
} from '@appsemble/react-components';
import { SAMLRedirectResponse, UserEmail } from '@appsemble/types';
import axios from 'axios';
import { ReactElement, useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useParams } from 'react-router-dom';

import { useUser } from '../../../components/UserProvider/index.js';
import { messages } from './messages.js';

export function EmailConflict(): ReactElement {
  const { lang } = useParams<{ lang: string }>();
  const push = useMessages();
  const { formatMessage } = useIntl();
  const qs = useQuery();
  const redirect = useLocationString();
  const { userInfo } = useUser();
  const [loading, setLoading] = useState(Boolean(userInfo));

  const email = qs.get('email');
  const id = qs.get('id');

  const skipLogin = useCallback(async () => {
    try {
      const { data } = await axios.post<SAMLRedirectResponse>('/api/saml/continue', { id });
      window.location.replace(data.redirect);
    } catch {
      push(formatMessage(messages.skipLoginError));
    }
  }, [formatMessage, id, push]);

  useEffect(() => {
    if (!userInfo) {
      return;
    }
    axios.get<UserEmail[]>('/api/user/email').then(async ({ data: emails }) => {
      if (!emails.some((u) => u.email === email)) {
        setLoading(false);
        return;
      }
      const { data: appRedirect } = await axios.post<SAMLRedirectResponse>('/api/saml/continue', {
        id,
      });
      window.location.replace(appRedirect.redirect);
    });
  }, [email, id, userInfo]);

  if (loading) {
    return <Loader />;
  }

  return (
    <Content main padding>
      <p className="py-3">
        <FormattedMessage {...messages.emailConflict} />
      </p>
      <span className="has-text-weight-bold">{email}</span>
      <p className="py-3">
        <FormattedMessage {...messages.emailConflictExplanation} />
      </p>
      <FormButtons>
        <Button
          color="primary"
          component={Link}
          to={{
            pathname: `/${lang}/Login`,
            search: String(new URLSearchParams({ redirect })),
          }}
        >
          <FormattedMessage {...messages.login} />
        </Button>
        <AsyncButton color="danger" onClick={skipLogin}>
          <FormattedMessage {...messages.skipLogin} />
        </AsyncButton>
      </FormButtons>
    </Content>
  );
}
