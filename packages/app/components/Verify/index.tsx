import { Message, useQuery } from '@appsemble/react-components';
import axios from 'axios';
import { type ReactNode, useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, useParams } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { apiUrl, appId } from '../../utils/settings.js';
import { BuiltinPage, BuiltinPageLoader } from '../BuiltinPage/index.js';

export function Verify(): ReactNode {
  const [submitting, setSubmitting] = useState(true);
  const [success, setSuccess] = useState(false);
  const qs = useQuery();
  const token = qs.get('token');
  const { lang } = useParams<{ lang: string }>();

  useEffect(() => {
    (async () => {
      try {
        await axios.post(`${apiUrl}/api/apps/${appId}/auth/email/verify`, { token });
        setSuccess(true);
      } catch {
        setSuccess(false);
      } finally {
        setSubmitting(false);
      }
    })();
  }, [token]);

  if (submitting) {
    return (
      <BuiltinPage page="verify" state="loading" title={messages.title}>
        <BuiltinPageLoader />
      </BuiltinPage>
    );
  }

  return (
    <BuiltinPage
      fallbackClassName={`container ${styles.root}`}
      narrow
      page="verify"
      state={success ? 'success' : 'error'}
      title={messages.title}
    >
      <Message color={success ? 'success' : 'danger'}>
        <FormattedMessage {...(success ? messages.requestSuccess : messages.requestFailed)} />
      </Message>
      <Link className="button is-primary" to={`/${lang}`}>
        <FormattedMessage {...messages.returnToApp} />
      </Link>
    </BuiltinPage>
  );
}
