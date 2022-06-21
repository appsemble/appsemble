import {
  Button,
  useConfirmation,
  useData,
  useMessages,
  useMeta,
} from '@appsemble/react-components';
import { AppDefinition, Snapshot } from '@appsemble/types';
import axios from 'axios';
import { lazy, ReactElement, Suspense, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useRouteMatch } from 'react-router-dom';
import { parse } from 'yaml';

import { useApp } from '../..';
import { AsyncDataView } from '../../../../../components/AsyncDataView';
import { CodeBlock } from '../../../../../components/CodeBlock';
import { HeaderControl } from '../../../../../components/HeaderControl';
import { messages } from './messages';

const CodeDiffBlock = lazy(() =>
  import('../../../../../components/CodeDiffBlock').then((m) => ({ default: m.CodeDiffBlock })),
);

export function SnapshotPage(): ReactElement {
  const { app, setApp } = useApp();
  const push = useMessages();
  const {
    params: { snapshotId },
  } = useRouteMatch<{ snapshotId: string }>();
  const { formatDate, formatMessage } = useIntl();
  const result = useData<Snapshot>(`/api/apps/${app.id}/snapshots/${snapshotId}`);
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
    const definition = parse(result.data.yaml, { maxAliasCount: 10_000 }) as AppDefinition;
    const data = new FormData();
    data.set('yaml', result.data.yaml);

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
      <HeaderControl
        className="mb-4"
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
      <AsyncDataView
        emptyMessage={<FormattedMessage {...messages.noSnapshot} />}
        errorMessage={<FormattedMessage {...messages.error} />}
        loadingMessage={<FormattedMessage {...messages.loading} />}
        result={result}
      >
        {(snapshot) => (
          <div className="is-flex is-flex-grow-1 is-flex-shrink-1">
            <Suspense fallback={<CodeBlock language="yaml">{app.yaml}</CodeBlock>}>
              <CodeDiffBlock
                className="is-flex-grow-1 is-flex-shrink-1"
                language="yaml"
                modified={snapshot.yaml}
                original={app.yaml}
              />
            </Suspense>
          </div>
        )}
      </AsyncDataView>
    </>
  );
}
