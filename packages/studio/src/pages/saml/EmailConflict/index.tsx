import {
  AsyncButton,
  Content,
  FormButtons,
  Loader,
  useLocationString,
  useMessages,
  useQuery,
} from '@appsemble/react-components';
import axios from 'axios';
import { ReactElement, useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useParams } from 'react-router-dom';
import { useUser } from 'studio/src/components/UserProvider';

import { UserEmail } from '../../../types';
import { messages } from './messages';

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
      const { data } = await axios.post('/api/saml/continue', { id });
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
      const { data: appRedirect } = await axios.post('/api/saml/continue', { id });
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
        <Link
          className="button is-primary"
          to={{
            pathname: `/${lang}/Login`,
            search: String(new URLSearchParams({ redirect })),
          }}
        >
          <FormattedMessage {...messages.login} />
        </Link>
        <AsyncButton color="danger" onClick={skipLogin}>
          <FormattedMessage {...messages.skipLogin} />
        </AsyncButton>
      </FormButtons>
    </Content>
  );
}
