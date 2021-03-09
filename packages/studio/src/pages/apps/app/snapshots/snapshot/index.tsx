import {
  Button,
  useConfirmation,
  useData,
  useMessages,
  useMeta,
} from '@appsemble/react-components';
import { AppDefinition } from '@appsemble/types';
import axios from 'axios';
import { safeLoad } from 'js-yaml';
import React, { lazy, ReactElement, Suspense, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useRouteMatch } from 'react-router-dom';

import { Snapshot as SnapshotType } from '..';
import { useApp } from '../..';
import { AsyncDataView } from '../../../../../components/AsyncDataView';
import { CodeBlock } from '../../../../../components/CodeBlock';
import { HeaderControl } from '../../../../../components/HeaderControl';
import { messages } from './messages';

const CodeDiffBlock = lazy(() =>
  import('../../../../../components/CodeDiffBlock').then((m) => ({ default: m.CodeDiffBlock })),
);

export function Snapshot(): ReactElement {
  const { app, setApp } = useApp();
  const push = useMessages();
  const {
    params: { snapshotId },
  } = useRouteMatch<{ snapshotId: string }>();
  const { formatDate, formatMessage } = useIntl();
  const result = useData<SnapshotType>(`/api/apps/${app.id}/snapshots/${snapshotId}`);
  const title = result.loading
    ? snapshotId
    : formatDate(result.data?.$created, {
        day: 'numeric',
        month: 'numeric',
        minute: 'numeric',
        hour: 'numeric',
        year: 'numeric',
      });
  useMeta(title);

  const onRestore = useCallback(async () => {
    const definition = safeLoad(result.data.yaml) as AppDefinition;
    const data = new FormData();
    data.set('yaml', result.data.yaml);
    data.set('definition', JSON.stringify(definition));

    try {
      await axios.patch(`/api/apps/${app.id}`, data);
      push({
        body: formatMessage(messages.restoreSuccess),
        color: 'primary',
      });
      setApp({ ...app, definition, yaml: result.data.yaml });
    } catch {
      push(formatMessage(messages.restoreError));
    }
  }, [app, formatMessage, push, result, setApp]);

  const onRestoreClick = useConfirmation({
    color: 'primary',
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: <FormattedMessage {...messages.restoreButton} />,
    title: <FormattedMessage {...messages.restoringTitle} />,
    body: <FormattedMessage {...messages.restoreDescription} />,
    action: onRestore,
  });

  return (
    <>
      <div className="mb-4">
        <HeaderControl
          control={
            <Button
              disabled={result.loading || Boolean(result.error) || result.data.yaml === app.yaml}
              onClick={onRestoreClick}
            >
              <FormattedMessage {...messages.restoreButton} />
            </Button>
          }
        >
          <FormattedMessage {...messages.title} values={{ name: title }} />
        </HeaderControl>
      </div>
      <AsyncDataView
        emptyMessage={<FormattedMessage {...messages.noSnapshot} />}
        errorMessage={<FormattedMessage {...messages.error} />}
        loadingMessage={<FormattedMessage {...messages.loading} />}
        result={result}
      >
        {(snapshot) => (
          <Suspense fallback={<CodeBlock code={app.yaml} language="yaml" />}>
            <CodeDiffBlock language="yaml" modified={snapshot.yaml} original={app.yaml} />
          </Suspense>
        )}
      </AsyncDataView>
    </>
  );
}
