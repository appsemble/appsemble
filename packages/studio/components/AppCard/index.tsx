import { Subtitle, Title } from '@appsemble/react-components';
import { type App } from '@appsemble/types';
import { defaultLocale } from '@appsemble/utils';
import { type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';

import styles from './index.module.css';
import { AppIcon } from '../AppIcon/index.js';
import { StarRating } from '../StarRating/index.js';

interface AppCardProps {
  /**
   * The app to render a card for.
   */
  readonly app: App;

  /**
   * An alternative place to link to.
   *
   * By default a link is generated towards the app’s store page.
   */
  readonly href?: string;
}

/**
 * Display the basic information of an app and a link for more details.
 */
export function AppCard({ app, href }: AppCardProps): ReactNode {
  const { lang } = useParams<{ lang: string }>();
  const appLang = app.definition.defaultLanguage || defaultLocale;

  return (
    <Link
      className={`card ${styles.overflow}`}
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
