import { Icon, Subtitle, Title } from '@appsemble/react-components';
import { App } from '@appsemble/types';
import { defaultLocale } from '@appsemble/utils';
import { ReactElement } from 'react';
import { useIntl } from 'react-intl';
import { Link, useParams } from 'react-router-dom';

import { StarRating } from '../StarRating';
import styles from './index.module.css';
import { messages } from './messages';

interface AppCardProps {
  app: App;
}

/**
 * Display the basic information of an app and a link for more details.
 */
export function AppCard({ app }: AppCardProps): ReactElement {
  const { formatMessage } = useIntl();
  const { lang } = useParams<{ lang: string }>();
  const appLang = app.definition.defaultLanguage || defaultLocale;

  return (
    <Link
      className="card"
      title={app.messages?.app?.description || app.definition.description}
      to={`/${lang}/apps/${app.id}`}
    >
      <div className="card-content">
        <div className="media">
          <figure className={`image is-128x128 ${styles.figure}`}>
            {app.iconUrl ? (
              <img
                alt={formatMessage(messages.icon)}
                className="is-rounded card"
                src={`/api/apps/${app.id}/icon?maskable=true`}
              />
            ) : (
              <Icon
                className={`${styles.iconFallback} card`}
                icon="mobile-alt"
                style={{ backgroundColor: app.iconBackground }}
              />
            )}
          </figure>
        </div>
        <Title className={`${styles.ellipsis} ${styles.title}`} lang={appLang} size={5}>
          {app.messages?.app?.name || app.definition.name}
        </Title>
        <Subtitle className={`mb-0 ${styles.ellipsis}`} lang={appLang} size={6}>
          {app.OrganizationName || app.OrganizationId}
        </Subtitle>
        <StarRating className={`pt-4 ${styles.rating}`} value={app.rating?.average ?? 0} />
      </div>
    </Link>
  );
}
