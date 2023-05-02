import { compareStrings } from '@appsemble/utils';
import { type ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, useParams } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { useApp } from '../../index.js';

export function IndexPage(): ReactElement {
  const { id, lang } = useParams<{ lang: string; id: string }>();
  const url = `/${lang}/apps/${id}/resources`;
  const { app } = useApp();

  return app.definition.resources ? (
    <div className="content">
      <p>
        <FormattedMessage {...messages.hasResources} />
      </p>
      <ul>
        {Object.keys(app.definition.resources)
          .sort(compareStrings)
          .map((resource) => (
            <li key={resource}>
              <Link to={`${url}/${resource}`}>{resource}</Link>
            </li>
          ))}
      </ul>
    </div>
  ) : (
    <div className={styles.noResources}>
      <span>
        <i className={`fas fa-folder-open ${styles.noResourcesIcon}`} />
      </span>
      <span>
        <FormattedMessage {...messages.noResources} />
      </span>
    </div>
  );
}
