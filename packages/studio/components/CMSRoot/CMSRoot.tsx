import { App } from '@appsemble/types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, useRouteMatch } from 'react-router-dom';

import useApp from '../../hooks/useApp';
import HelmetIntl from '../HelmetIntl';
import styles from './CMSRoot.css';
import messages from './messages';

export default function CMSRoot(): React.ReactElement {
  const match = useRouteMatch();
  const app = useApp();

  return (
    <>
      <HelmetIntl title={messages.title} titleValues={{ name: app.definition.name }} />
      {app.definition.resources ? (
        <div className="content">
          <p>
            <FormattedMessage {...messages.hasResources} />
          </p>
          <ul>
            {Object.keys(app.definition.resources)
              .sort()
              .map(resource => (
                <li key={resource}>
                  <Link to={`${match.url}/${resource}`}>{resource}</Link>
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
      )}
    </>
  );
}
