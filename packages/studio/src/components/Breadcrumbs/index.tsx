import { useBreadcrumbs } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import styles from './index.css';

/**
 * Render breadcrumbs based on the `<MetaProvider />`.
 */
export function Breadcrumbs(): ReactElement {
  const breadcrumbs = useBreadcrumbs();

  return (
    <div className={`pb-3 has-text-grey ${styles.root}`}>
      {breadcrumbs.map(({ title, url }, index) =>
        index === breadcrumbs.length - 1 ? (
          // There’s one specific case in the documentation that causes a URL to appear twice in the
          // breadcrumbs. For this reason we can’t use the URL as the key.
          // eslint-disable-next-line react/no-array-index-key
          <span className={`has-text-weight-bold ${styles.breadcrumb}`} key={index}>
            {title}
          </span>
        ) : (
          // eslint-disable-next-line react/no-array-index-key
          <span className={styles.breadcrumb} key={index}>
            <Link className="has-text-grey" to={url}>
              {title}
            </Link>
          </span>
        ),
      )}
    </div>
  );
}
