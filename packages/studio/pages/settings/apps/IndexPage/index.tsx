import { Title, useData } from '@appsemble/react-components';
import { AppAccount } from '@appsemble/types';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { useRouteMatch } from 'react-router-dom';

import { AppCard } from '../../../../components/AppCard/index.js';
import { AsyncDataView } from '../../../../components/AsyncDataView/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';

export function IndexPage(): ReactElement {
  const result = useData<AppAccount[]>('/api/user/apps/accounts');
  const { url } = useRouteMatch();

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
              <AppCard app={app} href={`${url}/${app.id}`} key={app.id} />
            ))}
          </div>
        )}
      </AsyncDataView>
    </main>
  );
}
