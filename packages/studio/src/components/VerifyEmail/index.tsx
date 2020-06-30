import { Loader, Message, useQuery } from '@appsemble/react-components';
import axios from 'axios';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import useUser from '../../hooks/useUser';
import styles from './index.css';
import messages from './messages';

export default function VerifyEmail(): React.ReactElement {
  const [submitting, setSubmitting] = React.useState(true);
  const [success, setSuccess] = React.useState(false);
  const qs = useQuery();
  const token = qs.get('token');
  const { refreshUserInfo } = useUser();

  React.useEffect(() => {
    (async () => {
      try {
        await axios.post('/api/email/verify', { token });
        setSuccess(true);
        await refreshUserInfo();
      } catch (error) {
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
