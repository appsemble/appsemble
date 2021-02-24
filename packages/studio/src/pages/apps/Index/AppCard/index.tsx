import { Subtitle, Title } from '@appsemble/react-components';
import { App } from '@appsemble/types';
import { defaultLocale } from '@appsemble/utils';
import { ReactElement } from 'react';
import { useIntl } from 'react-intl';
import { Link, useRouteMatch } from 'react-router-dom';

import { StarRating } from '../../../../components/StarRating';
import styles from './index.module.css';
import { messages } from './messages';

interface AppCardProps {
  app: App;
}

export function AppCard({ app }: AppCardProps): ReactElement {
  const { formatMessage } = useIntl();
  const { url } = useRouteMatch();
  const lang = app.definition.defaultLanguage || defaultLocale;

  return (
    <Link className="card" title={app.definition.description} to={`${url}/${app.id}`}>
      <div className="card-content">
        <div className="media">
          <figure className={`image is-128x128 ${styles.figure}`}>
            <img
              alt={formatMessage(messages.icon)}
              className="is-rounded card"
              src={`/api/apps/${app.id}/icon?maskable=true`}
            />
          </figure>
        </div>
        <Title className={styles.ellipsis} lang={lang} size={5}>
          {app.definition.name}
        </Title>
        <Subtitle className={`mb-0 ${styles.ellipsis}`} lang={lang} size={6}>
          @{app.OrganizationId}
        </Subtitle>
        <StarRating className={`pt-4 ${styles.rating}`} value={app.rating?.average || 0} />
      </div>
    </Link>
  );
}
