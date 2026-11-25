import { Message, useData } from '@appsemble/react-components';
import { type AppWarning } from '@appsemble/types';
import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, useParams } from 'react-router-dom';

import { messages } from './messages.js';
import { useApp } from '../index.js';

/**
 * Show the secrets of the app that need a value, linking to the secrets page.
 */
export function AppWarnings(): ReactNode {
  const { app } = useApp();
  const { lang } = useParams();
  const { data: warnings } = useData<AppWarning[]>(`/api/apps/${app.id}/warnings`);

  if (!warnings?.length) {
    return null;
  }

  return (
    <Message color="warning">
      <FormattedMessage {...messages.missingSecrets} values={{ count: warnings.length }} />
      <ul>
        {warnings.map(({ id, name, type }) => (
          <li key={`${type}-${id}`}>
            <Link to={`/${lang}/apps/${app.id}/${app.path}/secrets`}>{name}</Link>
          </li>
        ))}
      </ul>
    </Message>
  );
}
