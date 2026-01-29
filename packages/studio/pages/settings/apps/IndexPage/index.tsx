import { Message, Title } from '@appsemble/react-components';
// Import { type AppAccount } from '@appsemble/types';
import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

// Import styles from './index.module.css';
import { messages } from './messages.js';
// Import { AppCard } from '../../../../components/AppCard/index.js';
// import { AsyncDataView } from '../../../../components/AsyncDataView/index.js';

export function IndexPage(): ReactNode {
  // Const result = useData<AppAccount[]>('/api/users/current/apps/accounts');

  return (
    <main>
      <Title>
        <FormattedMessage {...messages.title} />
      </Title>
      <p className="content">
        <FormattedMessage {...messages.help} />
      </p>
      <Message color="warning">
        <div className="is-flex is-justify-content-space-between is-align-items-center">
          <p>
            This page is temporarily disabled due to a security issue, and we are working hard to
            fix it
            <br />
            <br />
            Please refer to the following{' '}
            <a href="https://gitlab.com/appsemble/appsemble/-/issues/2050">issue</a> for more
            information
          </p>
        </div>
      </Message>

      {/* <AsyncDataView
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
      </AsyncDataView> */}
    </main>
  );
}
