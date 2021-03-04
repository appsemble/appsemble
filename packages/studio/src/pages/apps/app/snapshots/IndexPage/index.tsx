import { Title, useData } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { FormattedDate, FormattedMessage, FormattedTime } from 'react-intl';
import { useRouteMatch } from 'react-router-dom';
import { ListButton } from 'studio/src/components/ListButton';

import { Snapshot } from '..';
import { useApp } from '../..';
import { AsyncDataView } from '../../../../../components/AsyncDataView';
import { messages } from './messages';

export function IndexPage(): ReactElement {
  const { app } = useApp();
  const result = useData<Snapshot[]>(`/api/apps/${app.id}/snapshots`);
  const { url } = useRouteMatch();

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
                subtitle={
                  snapshot.$author?.name ??
                  snapshot.$author?.id ?? <FormattedMessage {...messages.unknownUser} />
                }
                title={
                  <>
                    <span className="mr-1">
                      <FormattedDate value={snapshot.$created} />
                    </span>
                    <span>
                      <FormattedTime value={snapshot.$created} />
                    </span>
                  </>
                }
                to={`${url}/${snapshot.id}`}
              />
            ))}
          </ul>
        )}
      </AsyncDataView>
    </>
  );
}
