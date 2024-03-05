import { compareStrings } from '@appsemble/utils';
import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { useApp } from '../../index.js';

export function IndexPage(): ReactNode {
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
              <Link to={resource}>{resource}</Link>
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
