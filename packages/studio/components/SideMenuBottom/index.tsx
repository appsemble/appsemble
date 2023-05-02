import { type ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, useParams } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';

export function SideMenuBottom(): ReactElement {
  const { lang } = useParams<{ lang: string }>();

  return (
    <div className={`py-2 ${styles.root}`}>
      <Link className="has-text-grey" to={`/${lang}/privacy`}>
        <FormattedMessage {...messages.privacyPolicy} />
      </Link>
    </div>
  );
}
