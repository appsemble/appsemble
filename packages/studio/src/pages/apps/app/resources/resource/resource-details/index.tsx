import { Button, Tab, Tabs, useData, useMessages, useMeta } from '@appsemble/react-components';
import { Resource } from '@appsemble/types';
import { download, serializeResource } from '@appsemble/web-utils';
import axios from 'axios';
import { lazy, ReactElement, Suspense, useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useHistory, useLocation, useRouteMatch } from 'react-router-dom';

import { useApp } from '../../..';
import { AsyncDataView } from '../../../../../../components/AsyncDataView';
import { HeaderControl } from '../../../../../../components/HeaderControl';
import { JSONSchemaEditor } from '../../../../../../components/JSONSchemaEditor';
import styles from './index.module.css';
import { messages } from './messages';

const tabOptions = new Set(['#edit', '#json', '#properties']);

const MonacoEditor = lazy(() =>
  import('../../../../../../components/MonacoEditor').then((m) => ({ default: m.MonacoEditor })),
);

export function ResourceDetailsPage(): ReactElement {
  const {
    params: { id, resourceId, resourceName },
    url,
  } = useRouteMatch<{ id: string; resourceName: string; resourceId: string }>();
  const { app } = useApp();
  const push = useMessages();
  const { formatMessage } = useIntl();
  const { hash } = useLocation();
  const history = useHistory();
  const result = useData<Resource>(`/api/apps/${id}/resources/${resourceName}/${resourceId}`);
  const [submitting, setSubmitting] = useState(false);
  const [editingResource, setEditingResource] = useState<Record<string, unknown>>();
  const [editingResourceJson, setEditingResourceJson] = useState<string>();

  useMeta(resourceId);

  const setResource = useCallback(
    ({ $author, $clonable, $created, $updated, id: unused, ...rest }: Resource) => {
      setEditingResource(rest);
      setEditingResourceJson(`${JSON.stringify(rest, null, 2)}\n`);
    },
    [],
  );

  useEffect(() => {
    if (!tabOptions.has(hash)) {
      history.replace({ hash: 'properties' });
    }
  }, [hash, history]);

  useEffect(() => {
    if (!editingResource && !result.loading && result.data) {
      setResource(result.data);
    }
  }, [editingResource, result, setResource]);

  const onClickTab = useCallback((unused, tab: string) => history.push({ hash: tab }), [history]);
  const onCopyResource = useCallback(() => {
    try {
      navigator.clipboard.writeText(JSON.stringify(result.data, null, 2));
      push({ color: 'info', body: formatMessage(messages.copySuccess) });
    } catch {
      push(formatMessage(messages.copyError));
    }
  }, [formatMessage, push, result]);

  const onDownloadResource = useCallback(async () => {
    await download(
      `/api/apps/${app.id}/resources/${resourceName}/${resourceId}`,
      `${resourceName} ${resourceId}.json`,
      'application/json',
    );
  }, [app, resourceName, resourceId]);

  const onEditChange = useCallback((unused, value: Resource) => {
    setEditingResource(value);
  }, []);

  const onEditJsonChange = useCallback((unused, value: string) => {
    setEditingResourceJson(value);
  }, []);

  const onEditSubmit = useCallback(async () => {
    try {
      setSubmitting(true);
      const { data } = await axios.put<Resource>(
        `/api/apps/${id}/resources/${resourceName}/${resourceId}`,
        hash === '#json' ? JSON.parse(editingResourceJson) : serializeResource(editingResource),
      );
      push({
        body: formatMessage(messages.updateSuccess, { id: resourceId }),
        color: 'primary',
      });
      result.setData(data);
      setResource(data);
      setSubmitting(false);
    } catch {
      push(formatMessage(messages.updateError));
    }
  }, [
    editingResource,
    editingResourceJson,
    formatMessage,
    hash,
    id,
    push,
    resourceId,
    resourceName,
    result,
    setResource,
  ]);

  return (
    <>
      <HeaderControl
        control={
          <div className="is-flex is-justify-content-flex-end">
            <Button
              className="mb-4 mr-2"
              color="primary"
              disabled={submitting}
              icon="save"
              loading={submitting}
              onClick={onEditSubmit}
            >
              <FormattedMessage {...messages.save} />
            </Button>
            <Button
              className="mb-4 mr-2"
              icon="download"
              onClick={onDownloadResource}
              title={formatMessage(messages.download)}
            />
            <Button
              className="mb-4"
              icon="copy"
              onClick={onCopyResource}
              title={formatMessage(messages.copy)}
            />
          </div>
        }
      >
        {resourceName} {resourceId}
      </HeaderControl>
      <AsyncDataView
        errorMessage={<FormattedMessage {...messages.error} />}
        loadingMessage={<FormattedMessage {...messages.loading} />}
        result={result}
      >
        {() => (
          <div className={`is-flex is-flex-direction-column ${styles.flexContent}`}>
            <Tabs onChange={onClickTab} value={hash}>
              <Tab href={`${url}#properties`} value="#properties">
                <FormattedMessage {...messages.properties} />
              </Tab>
              <Tab href={`${url}#json`} value="#json">
                <FormattedMessage {...messages.json} />
              </Tab>
            </Tabs>
            {hash === '#properties' && (
              <>
                <JSONSchemaEditor
                  name="resource"
                  onChange={onEditChange}
                  schema={app.definition.resources[resourceName].schema}
                  value={editingResource}
                />
                <div className="is-flex is-justify-content-flex-end">
                  <Button
                    className="my-4"
                    color="primary"
                    disabled={submitting}
                    icon="save"
                    loading={submitting}
                    onClick={onEditSubmit}
                  >
                    <FormattedMessage {...messages.save} />
                  </Button>
                </div>
              </>
            )}
            {hash === '#json' && (
              <Suspense fallback={<FormattedMessage {...messages.loadingEditor} />}>
                <MonacoEditor
                  className={styles.flexContent}
                  language="json"
                  onChange={onEditJsonChange}
                  onSave={onEditSubmit}
                  uri={`resources/${resourceName}/${resourceId}.json`}
                  value={editingResourceJson}
                />
              </Suspense>
            )}
          </div>
        )}
      </AsyncDataView>
    </>
  );
}
