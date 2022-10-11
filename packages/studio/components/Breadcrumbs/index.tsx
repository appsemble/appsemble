import { useBreadcrumbs } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import { messages } from './messages.js';

/**
 * Render breadcrumbs based on the `<MetaProvider />`.
 */
export function Breadcrumbs(): ReactElement {
  const breadcrumbs = useBreadcrumbs();
  const { formatMessage } = useIntl();

  return (
    <nav aria-label={formatMessage(messages.breadcrumbs)} className="breadcrumb">
      <ul>
        {breadcrumbs.map(({ title, url }, index) => {
          const current = index === breadcrumbs.length - 1;
          return (
            <li
              aria-current={current ? 'page' : null}
              className={current ? 'is-active' : null}
              // eslint-disable-next-line react/no-array-index-key
              key={index}
            >
              <Link relative="path" to={url}>
                {title}
              </Link>
            </li>
          );
        })}
        {breadcrumbs.length === 3 && breadcrumbs[2].url.includes('/edit/gui') && (
          <a
            className="button is-rounded is-transparent is-bordered is-small"
            href={breadcrumbs[2].url}
          >
            Switch to code editor
          </a>
        )}
        {breadcrumbs.length === 3 &&
          breadcrumbs[2].url.includes('/edit') &&
          !breadcrumbs[2].url.includes('/edit/gui') && (
            <a
              className="button is-rounded is-transparent is-bordered is-small"
              href={`${breadcrumbs[2].url}/gui`}
            >
              Switch to GUI editor
            </a>
          )}
      </ul>
    </nav>
  );
}
