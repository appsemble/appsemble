import { Title, useData } from '@appsemble/react-components';
import { type AppAccount } from '@appsemble/types';
import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import { AppCard } from '../../../../components/AppCard/index.js';
import { AsyncDataView } from '../../../../components/AsyncDataView/index.js';

export function IndexPage(): ReactNode {
  const result = useData<AppAccount[]>('/api/users/current/apps/accounts');

  return (
    <main>
      <Title>
        <FormattedMessage {...messages.title} />
      </Title>
      <p className="content">
        <FormattedMessage {...messages.help} />
      </p>
      <AsyncDataView
        emptyMessage={<FormattedMessage {...messages.empty} />}
        errorMessage={<FormattedMessage {...messages.error} />}
        loadingMessage={<FormattedMessage {...messages.loading} />}
        result={result}
      >
        {(members) => (
          <div className={styles.list}>
            {members.map(({ app }) => (
              <AppCard app={app} href={`../../../settings/user/apps/${app.id}`} key={app.id} />
            ))}
          </div>
        )}
      </AsyncDataView>
    </main>
  );
}
