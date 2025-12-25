import { Button, Tab, Tabs, useData, useMessages, useMeta } from '@appsemble/react-components';
import { type Resource } from '@appsemble/types';
import { serializeResource } from '@appsemble/utils';
import { download, type NamedEvent } from '@appsemble/web-utils';
import axios from 'axios';
import classNames from 'classnames';
import { type editor } from 'monaco-editor/esm/vs/editor/editor.api.js';
import {
  lazy,
  type ReactNode,
  Suspense,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { ResourceHistory } from './ResourceHistory/index.js';
import { AsyncDataView } from '../../../../../../components/AsyncDataView/index.js';
import { HeaderControl } from '../../../../../../components/HeaderControl/index.js';
import { JSONSchemaEditor } from '../../../../../../components/JSONSchemaEditor/index.js';
import { useApp } from '../../../index.js';

/**
 * Pass along the resource name from the GUI editor `Resources` tab
 */
interface Props {
  readonly guiResourceName?: string;
  readonly guiResourceId?: string;
}

const tabOptions = new Set(['#history', '#json', '#properties']);

const MonacoEditor = lazy(() =>
  import('../../../../../../components/MonacoEditor/index.js').then((m) => ({
    default: m.MonacoEditor,
  })),
);

export function ResourceDetailsPage({ guiResourceId, guiResourceName }: Props): ReactNode {
  const { resourceId: paramResourceId, resourceName: paramResourceName } = useParams<{
    resourceName: string;
    resourceId: string;
  }>();
  const resourceName: string = guiResourceName || paramResourceName;
  const resourceId: string = guiResourceId || paramResourceId;
  const { app } = useApp();
  const push = useMessages();
  const { formatMessage } = useIntl();
  const { hash } = useLocation();
  const navigate = useNavigate();
  const resourceDefinition = app.definition.resources[resourceName];
  const resourceUrl = `/api/apps/${app.id}/resources/${resourceName}/${resourceId}`;
  const result = useData<Resource>(resourceUrl);
  const [submitting, setSubmitting] = useState(false);
  const [editingResource, setEditingResource] = useState<Record<string, unknown>>();
  const [editingResourceJson, setEditingResourceJson] = useState<string>();

  useMeta(resourceId);

  const setResource = useCallback(
    ({
      $author,
      $clonable,
      $created,
      $editor,
      $updated,
      id: unused,
      Position,
      ...rest
    }: Resource) => {
      setEditingResource(rest);
      setEditingResourceJson(`${JSON.stringify(rest, null, 2)}\n`);
    },
    [],
  );

  useEffect(() => {
    if (!editingResource && !result.loading && result.data) {
      setResource(result.data);
    }
  }, [editingResource, result, setResource]);

  const onClickTab = useCallback(
    (unused: SyntheticEvent, tab: string) => navigate({ hash: tab }),
    [navigate],
  );
  const onCopyResource = useCallback(() => {
    try {
      navigator.clipboard.writeText(JSON.stringify(result.data, null, 2));
      push({ color: 'info', body: formatMessage(messages.copySuccess) });
    } catch {
      push(formatMessage(messages.copyError));
    }
  }, [formatMessage, push, result]);

  const onDownloadResource = useCallback(async () => {
    await download(resourceUrl, `${resourceName} ${resourceId}.json`, 'application/json');
  }, [resourceName, resourceId, resourceUrl]);

  const onEditChange = useCallback((unused: NamedEvent, value: Resource) => {
    setEditingResource(value);
  }, []);

  const onEditJsonChange = useCallback(
    (unused: editor.IModelContentChangedEvent, value: string) => {
      setEditingResourceJson(value);
    },
    [],
  );

  const onEditSubmit = useCallback(async () => {
    try {
      setSubmitting(true);
      const { data } = await axios.put<Resource>(
        resourceUrl,
        hash === '#json' ? JSON.parse(editingResourceJson) : serializeResource(editingResource),
      );
      push({
        body: formatMessage(messages.updateSuccess, { id: data.id }),
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
    push,
    resourceUrl,
    result,
    setResource,
  ]);

  if (!tabOptions.has(hash)) {
    return <Navigate to="#properties" />;
  }

  return (
    <>
      <HeaderControl
        control={
          <div
            className={classNames('is-flex is-justify-content-flex-end', {
              [styles.inGui]: guiResourceName !== undefined,
            })}
          >
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
      <div
        className={classNames('is-flex is-flex-direction-column', String(styles.flexContent), {
          [styles.inGui]: guiResourceName !== undefined,
        })}
      >
        <Tabs onChange={onClickTab} value={hash}>
          <Tab href="#properties" value="#properties">
            <FormattedMessage {...messages.properties} />
          </Tab>
          <Tab href="#json" value="#json">
            <FormattedMessage {...messages.json} />
          </Tab>
          {resourceDefinition.history ? (
            <Tab href="#history" value="#history">
              <FormattedMessage {...messages.history} />
            </Tab>
          ) : null}
        </Tabs>
        <AsyncDataView
          errorMessage={<FormattedMessage {...messages.error} />}
          loadingMessage={<FormattedMessage {...messages.loading} />}
          result={result}
        >
          {() =>
            hash === '#json' ? (
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
            ) : hash === '#history' ? (
              <ResourceHistory />
            ) : (
              <>
                <JSONSchemaEditor
                  name="resource"
                  onChange={onEditChange}
                  schema={resourceDefinition.schema}
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
            )
          }
        </AsyncDataView>
      </div>
    </>
  );
}
