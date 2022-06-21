import { Subtitle, Title } from '@appsemble/react-components';
import { App } from '@appsemble/types';
import { defaultLocale } from '@appsemble/utils';
import { ReactElement } from 'react';
import { Link, useParams } from 'react-router-dom';

import { AppIcon } from '../AppIcon';
import { StarRating } from '../StarRating';
import styles from './index.module.css';

interface AppCardProps {
  /**
   * The app to render a card for.
   */
  app: App;

  /**
   * An alternative place to link to.
   *
   * By default a link is generated towards the app’s store page.
   */
  href?: string;
}

/**
 * Display the basic information of an app and a link for more details.
 */
export function AppCard({ app, href }: AppCardProps): ReactElement {
  const { lang } = useParams<{ lang: string }>();
  const appLang = app.definition.defaultLanguage || defaultLocale;

  return (
    <Link
      className="card"
      title={app.messages?.app?.description || app.definition.description}
      to={href ?? `/${lang}/apps/${app.id}`}
    >
      <div className="card-content">
        <div className="media">
          <figure className={`image is-128x128 ${styles.figure}`}>
            <AppIcon app={app} />
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
