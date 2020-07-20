import type { App } from '@appsemble/types';
import classNames from 'classnames';
import React, { ReactElement } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useRouteMatch } from 'react-router-dom';

import getAppUrl from '../../../../utils/getAppUrl';
import Rating from '../../../Rating';
import styles from './index.css';
import messages from './messages';

interface AppCardProps {
  app: App;
}

export default function AppCard({ app }: AppCardProps): ReactElement {
  const { formatMessage } = useIntl();
  const { url } = useRouteMatch();

  return (
    <div className={classNames('card', styles.appCard)}>
      <header className="card-header">
        <p className="card-header-title">{app.definition.name}</p>
      </header>
      <div className={classNames('card-content', styles.appCardContent)}>
        <div className="media">
          <figure className={classNames('image', 'is-64x64', styles.image)}>
            <img alt={formatMessage(messages.icon)} src={`/api/apps/${app.id}/icon`} />
          </figure>
        </div>
        {app.definition.description && (
          <div className={classNames('content', styles.appDescription)}>
            {app.definition.description}
          </div>
        )}
        <Rating
          className={styles.rating}
          count={(app.rating && app.rating.count) || 0}
          value={(app.rating && app.rating.average) || 0}
        />
      </div>
      <footer className={classNames('card-footer', styles.appCardFooter)}>
        <a
          className="card-footer-item"
          href={getAppUrl(app.OrganizationId, app.path, app.domain)}
          rel="noopener noreferrer"
          target="_blank"
        >
          <FormattedMessage {...messages.view} />
        </a>
        <Link className="card-footer-item" to={`${url}/${app.id}`}>
          <FormattedMessage {...messages.details} />
        </Link>
      </footer>
    </div>
  );
}
