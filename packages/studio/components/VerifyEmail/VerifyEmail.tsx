import { Loader } from '@appsemble/react-components';
import axios from 'axios';
import classNames from 'classnames';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import useQuery from '../../hooks/useQuery';
import messages from './messages';
import styles from './VerifyEmail.css';

export default function VerifyEmail(): React.ReactElement {
  const [submitting, setSubmitting] = React.useState(true);
  const [success, setSuccess] = React.useState(false);
  const qs = useQuery();
  const token = qs.get('token');

  React.useEffect(() => {
    (async () => {
      try {
        await axios.post('/api/email/verify', { token });
        setSuccess(true);
      } catch (error) {
        setSuccess(false);
      } finally {
        setSubmitting(false);
      }
    })();
  }, [token]);

  if (submitting) {
    return <Loader />;
  }

  if (success) {
    return (
      <div className={classNames('container', styles.root)}>
        <article className="message is-success">
          <div className="message-body">
            <FormattedMessage {...messages.requestSuccess} />
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className={classNames('container', styles.root)}>
      <article className="message is-danger">
        <div className="message-body">
          <FormattedMessage {...messages.requestFailed} />
        </div>
      </article>
    </div>
  );
}
