import { Loader, Message, useQuery } from '@appsemble/react-components';
import axios from 'axios';
import { type ReactNode, useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useNavigate } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { useUser } from '../../components/UserProvider/index.js';

export function VerifyPage(): ReactNode {
  const [submitting, setSubmitting] = useState(true);
  const [success, setSuccess] = useState(false);
  const qs = useQuery();
  const token = qs.get('token');
  const { refreshUserInfo } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        await axios.post('/api/auth/email/verify', { token });
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
    setTimeout(() => navigate('/apps/', { replace: true }), 3000);
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
