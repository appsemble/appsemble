import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';

export function SideMenuBottom(): ReactNode {
  return (
    <div className={`py-2 ${styles.root}`}>
      <Link className="has-text-grey" to="privacy">
        <FormattedMessage {...messages.privacyPolicy} />
      </Link>
    </div>
  );
}
