import React, { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, useRouteMatch } from 'react-router-dom';

import { useApp } from '../AppContext';
import HelmetIntl from '../HelmetIntl';
import styles from './index.css';
import messages from './messages';

export default function CMSRoot(): ReactElement {
  const { url } = useRouteMatch();
  const { app } = useApp();

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
      )}
    </>
  );
}
