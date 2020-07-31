import { Subtitle, Title } from '@appsemble/react-components/src';
import type { App } from '@appsemble/types';
import classNames from 'classnames';
import React, { ReactElement, useCallback } from 'react';
import { useIntl } from 'react-intl';
import { Link, useHistory, useRouteMatch } from 'react-router-dom';

import Rating from '../../../Rating';
import styles from './index.css';
import messages from './messages';

interface AppCardProps {
  app: App;
}

export default function AppCard({ app }: AppCardProps): ReactElement {
  const { formatMessage } = useIntl();
  const { url } = useRouteMatch();
  const history = useHistory();
  const onClick = useCallback(() => {
    history.push(`${url}/${app.id}`);
  }, [app, history, url]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter') {
        onClick();
      }
    },
    [onClick],
  );

  return (
    <div
      className={classNames('card', styles.appCard)}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className={classNames('card-content', styles.appCardContent)}>
        <div className="media">
          <figure className={classNames('image', 'is-128x128', styles.image)}>
            <img alt={formatMessage(messages.icon)} src={`/api/apps/${app.id}/icon`} />
          </figure>
        </div>
        <Title level={4}>
          <Link className="has-text-dark" to={`${url}/${app.id}`}>
            {app.definition.name}
          </Link>
        </Title>
        {/* XXX Make this a link to the organization page */}
        <Subtitle className="mb-0" level={6}>
          @{app.OrganizationId}
        </Subtitle>
        <Rating className={styles.rating} value={(app.rating && app.rating.average) || 0} />
      </div>
    </div>
  );
}
