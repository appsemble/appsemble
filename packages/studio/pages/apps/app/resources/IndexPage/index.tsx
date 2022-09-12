import { compareStrings } from '@appsemble/utils';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, useRouteMatch } from 'react-router-dom';

import { useApp } from '../../index.js';
import styles from './index.module.css';
import { messages } from './messages.js';

export function IndexPage(): ReactElement {
  const { url } = useRouteMatch();
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
