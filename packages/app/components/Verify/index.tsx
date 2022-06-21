import { Loader, Message, useMeta, useQuery } from '@appsemble/react-components';
import axios from 'axios';
import { ReactElement, useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, useParams } from 'react-router-dom';

import { apiUrl, appId } from '../../utils/settings';
import styles from './index.module.css';
import { messages } from './messages';

export function Verify(): ReactElement {
  useMeta(messages.title);

  const [submitting, setSubmitting] = useState(true);
  const [success, setSuccess] = useState(false);
  const qs = useQuery();
  const token = qs.get('token');
  const { lang } = useParams<{ lang: string }>();

  useEffect(() => {
    (async () => {
      try {
        await axios.post(`${apiUrl}/api/user/apps/${appId}/account/verify`, { token });
        setSuccess(true);
      } catch {
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
      <div className={`container px-3 py-3 ${styles.root}`}>
        <Message color="success">
          <FormattedMessage {...messages.requestSuccess} />
        </Message>
        <Link className="button is-primary" to={`/${lang}`}>
          <FormattedMessage {...messages.returnToApp} />
        </Link>
      </div>
    );
  }

  return (
    <div className={`container ${styles.root}`}>
      <Message color="danger">
        <FormattedMessage {...messages.requestFailed} />
      </Message>
      <Link className="button is-primary" to={`/${lang}`}>
        <FormattedMessage {...messages.returnToApp} />
      </Link>
    </div>
  );
}
