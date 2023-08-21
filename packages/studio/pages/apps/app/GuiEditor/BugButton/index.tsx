import { Button } from '@appsemble/react-components';
import { type ReactElement } from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from '../messages.js';

export function BugButton(): ReactElement {
  const { formatMessage } = useIntl();

  return (
    <Link
      className={styles.bugButton}
      target="_blank"
      to="https://gitlab.com/appsemble/appsemble/-/issues/1125"
    >
      <Button icon="bug" title={formatMessage(messages.reportBug)} />
    </Link>
  );
}
