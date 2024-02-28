import { Title, useData } from '@appsemble/react-components';
import { type Snapshot } from '@appsemble/types';
import { type ReactNode } from 'react';
import { FormattedDate, FormattedMessage } from 'react-intl';

import { messages } from './messages.js';
import { AsyncDataView } from '../../../../../components/AsyncDataView/index.js';
import { ListButton } from '../../../../../components/ListButton/index.js';
import { useApp } from '../../index.js';

export function IndexPage(): ReactNode {
  const { app } = useApp();
  const result = useData<Snapshot[]>(`/api/apps/${app.id}/snapshots`);

  return (
    <>
      <Title>
        <FormattedMessage {...messages.title} />
      </Title>
      <AsyncDataView
        emptyMessage={<FormattedMessage {...messages.noSnapshots} />}
        errorMessage={<FormattedMessage {...messages.error} />}
        loadingMessage={<FormattedMessage {...messages.loading} />}
        result={result}
      >
        {(snapshots) => (
          <ul>
            {snapshots.map((snapshot) => (
              <ListButton
                icon="file-code"
                key={snapshot.id}
                // XXX: The Appsemble fallback should be removed after making user required
                subtitle={snapshot.$author?.name ?? snapshot.$author?.id ?? 'Appsemble'}
                title={
                  <FormattedDate
                    day="numeric"
                    hour="numeric"
                    minute="numeric"
                    month="long"
                    value={snapshot.$created}
                    year="numeric"
                  />
                }
                to={String(snapshot.id)}
              />
            ))}
          </ul>
        )}
      </AsyncDataView>
    </>
  );
}
