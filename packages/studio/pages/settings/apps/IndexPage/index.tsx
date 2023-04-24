import { Title, useData } from '@appsemble/react-components';
import { type AppAccount } from '@appsemble/types';
import { type ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { useParams } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { AppCard } from '../../../../components/AppCard/index.js';
import { AsyncDataView } from '../../../../components/AsyncDataView/index.js';

export function IndexPage(): ReactElement {
  const result = useData<AppAccount[]>('/api/user/apps/accounts');
  const { lang } = useParams<{ lang: string }>();
  const url = `/${lang}/settings/apps`;

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
