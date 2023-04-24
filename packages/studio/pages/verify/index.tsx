import { Loader, Message, useQuery } from '@appsemble/react-components';
import axios from 'axios';
import { type ReactElement, useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import { useUser } from '../../components/UserProvider/index.js';

export function VerifyPage(): ReactElement {
  const [submitting, setSubmitting] = useState(true);
  const [success, setSuccess] = useState(false);
  const qs = useQuery();
  const token = qs.get('token');
  const { refreshUserInfo } = useUser();

  useEffect(() => {
    (async () => {
      try {
        await axios.post('/api/email/verify', { token });
        setSuccess(true);
        await refreshUserInfo();
      } catch {
        setSuccess(false);
      } finally {
        setSubmitting(false);
      }
    })();
  }, [token, refreshUserInfo]);

  if (submitting) {
    return <Loader />;
  }

  if (success) {
    return (
      <div className={`container px-3 py-3 ${styles.root}`}>
        <Message color="success">
          <FormattedMessage {...messages.requestSuccess} />
        </Message>
      </div>
    );
  }

  return (
    <div className={`container ${styles.root}`}>
      <Message color="danger">
        <FormattedMessage {...messages.requestFailed} />
      </Message>
    </div>
  );
}
