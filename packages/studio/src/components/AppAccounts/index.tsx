import { Button, Content, Loader, Message, Title, useData } from '@appsemble/react-components';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';

interface AppAccount {
  AppId: number;
  appName: string;
  domain: string;
  icon: string;
  OrganizationId: string;
  path: string;
  providerName: string;
  sub: string;
}

export default function AppAccounts(): React.ReactElement {
  const { data: accounts, error, loading, refresh } = useData<AppAccount[]>(
    '/api/user/app-accounts',
  );

  return (
    <Content>
      <Title level={1}>
        <FormattedMessage {...messages.title} />
      </Title>
      {loading && <Loader />}
      {error && (
        <Message color="danger">
          <FormattedMessage {...messages.error} />
          <Button color="danger" onClick={refresh}>
            <FormattedMessage {...messages.reload} />
          </Button>
        </Message>
      )}
      {accounts?.length === 0 && (
        <Message color="info">
          <FormattedMessage {...messages.noAccounts} />
        </Message>
      )}
      {accounts?.map((account) => (
        <div>
          <a href="#asd" rel="noopener noferere" target="_blank">
            {account.appName}
          </a>
        </div>
      ))}
    </Content>
  );
}
