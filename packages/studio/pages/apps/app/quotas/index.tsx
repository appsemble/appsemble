import { Content, Loader, Title, useData, useMeta } from '@appsemble/react-components';
import { type Quota } from '@appsemble/types';
import { type ReactElement } from 'react';
import { FormattedMessage, type MessageDescriptor } from 'react-intl';

import { messages } from './messages.js';
import { useApp } from '../index.js';

interface QuotaProps {
  readonly name: MessageDescriptor;
  readonly quota: Quota;
}

function QuotaCard({ name, quota: { limit, used } }: QuotaProps): ReactElement {
  return (
    <div className="column is-half">
      <div className="box">
        <span>
          <i className="fa-solid fa-envelope mr-1" />
          <FormattedMessage {...name} />
        </span>
        <span className="is-pulled-right">
          {used}/{limit}
        </span>
        <progress className="progress is-primary" max={limit} value={used} />
      </div>
    </div>
  );
}

export function QuotasPage(): ReactElement {
  useMeta(messages.title);
  const { app } = useApp();
  const { data: emailData, loading } = useData<Quota | null>(`/api/apps/${app.id}/quotas/email`);
  return (
    <Content>
      <Title>
        <FormattedMessage {...messages.title} />
      </Title>
      <div className="columns is-multiline">
        {loading ? <Loader /> : <QuotaCard name={messages.emailTitle} quota={emailData} />}
      </div>
    </Content>
  );
}
