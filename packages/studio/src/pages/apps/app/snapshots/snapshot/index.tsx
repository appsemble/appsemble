import { Title, useData } from '@appsemble/react-components';
import React, { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { useRouteMatch } from 'react-router-dom';

import { Snapshot as SnapshotType } from '..';
import { useApp } from '../..';
import { AsyncDataView } from '../../../../../components/AsyncDataView';
import { CodeBlock } from '../../../../../components/CodeBlock';
import { messages } from './messages';

export function Snapshot(): ReactElement {
  const { app } = useApp();
  const {
    params: { snapshotId },
  } = useRouteMatch<{ snapshotId: string }>();
  const result = useData<SnapshotType>(`/api/apps/${app.id}/snapshots/${snapshotId}`);

  return (
    <>
      <Title>
        <FormattedMessage {...messages.title} />
      </Title>
      <AsyncDataView
        emptyMessage={<FormattedMessage {...messages.noSnapshot} />}
        errorMessage={<FormattedMessage {...messages.error} />}
        loadingMessage={<FormattedMessage {...messages.loading} />}
        result={result}
      >
        {(snapshot) => <CodeBlock code={snapshot.yaml} language="yaml" />}
      </AsyncDataView>
    </>
  );
}
