import {
  Button,
  Tab,
  Tabs,
  Title,
  useData,
  useMessages,
  useMeta,
  useToggle,
} from '@appsemble/react-components';
import { NamedEvent } from '@appsemble/web-utils';
import axios from 'axios';
import { ReactElement, useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useHistory, useLocation, useRouteMatch } from 'react-router-dom';

import { useApp } from '../../..';
import { AsyncDataView } from '../../../../../../components/AsyncDataView';
import { CodeBlock } from '../../../../../../components/CodeBlock';
import { JSONSchemaEditor } from '../../../../../../components/JSONSchemaEditor';
import { Resource } from '../IndexPage';
import { messages } from './messages';

const tabOptions = new Set(['#edit', '#json', '#properties']);

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
  const isEditingResource = useToggle();
  const [editingResource, setEditingResource] = useState<Resource>();

  useMeta(resourceId);

  useEffect(() => {
    if (!tabOptions.has(hash)) {
      history.push({ hash: 'properties' });
    }
  }, [hash, history]);

  useEffect(() => {
    if (!editingResource && !result.loading && result.data) {
      setEditingResource(result.data);
    }
  }, [editingResource, result]);

  const onClickTab = useCallback((event, tab: string) => history.push({ hash: tab }), [history]);
  const onCopyResource = useCallback(() => {
    try {
      navigator.clipboard.writeText(JSON.stringify(result.data, null, 2));
      push({ color: 'info', body: formatMessage(messages.copySuccess) });
    } catch {
      push(formatMessage(messages.copyError));
    }
  }, [formatMessage, push, result]);

  const onEditChange = useCallback((event: NamedEvent, value: Resource) => {
    setEditingResource(value);
  }, []);

  const onEditSubmit = useCallback(async () => {
    try {
      const { data } = await axios.put<Resource>(
        `/api/apps/${id}/resources/${resourceName}/${resourceId}`,
        editingResource,
      );
      push({
        body: formatMessage(messages.updateSuccess, { id: resourceId }),
        color: 'primary',
      });
      result.setData(data);
      isEditingResource.disable();
    } catch {
      push(formatMessage(messages.updateError));
    }
  }, [
    editingResource,
    formatMessage,
    id,
    isEditingResource,
    push,
    resourceId,
    resourceName,
    result,
  ]);

  const schema = app.definition.resources?.[resourceName]?.schema;

  return (
    <>
      <Title>
        {resourceName} {resourceId}
      </Title>
      <AsyncDataView
        errorMessage={<FormattedMessage {...messages.error} />}
        loadingMessage={<FormattedMessage {...messages.loading} />}
        result={result}
      >
        {(resource) => (
          <>
            <Tabs onChange={onClickTab} value={hash}>
              <Tab href={`${url}#properties`} value="#properties">
                <FormattedMessage {...messages.properties} />
              </Tab>
              <Tab href={`${url}#json`} value="#json">
                <FormattedMessage {...messages.json} />
              </Tab>
              <Tab href={`${url}#edit`} value="#edit">
                <FormattedMessage {...messages.edit} />
              </Tab>
            </Tabs>
            {hash === '#properties' && <div />}
            {hash === '#json' && (
              <>
                <div className="is-flex is-justify-content-flex-end">
                  {isEditingResource.enabled ? (
                    <Button
                      className="mb-4 mr-2"
                      color="primary"
                      icon="save"
                      onClick={onEditSubmit}
                    >
                      <FormattedMessage {...messages.save} />
                    </Button>
                  ) : (
                    <Button className="mb-4 mr-2" icon="edit" onClick={isEditingResource.enable}>
                      <FormattedMessage {...messages.edit} />
                    </Button>
                  )}
                  <Button
                    className="mb-4"
                    icon="copy"
                    onClick={onCopyResource}
                    title={formatMessage(messages.copy)}
                  />
                </div>
                <CodeBlock code={JSON.stringify(resource, null, 2)} language="json" />
              </>
            )}
            {hash === '#edit' && (
              <>
                <JSONSchemaEditor
                  name="resource"
                  onChange={onEditChange}
                  schema={schema}
                  value={editingResource}
                />
                <div className="is-flex is-justify-content-flex-end">
                  <Button className="my-4" color="primary" onClick={onEditSubmit}>
                    <FormattedMessage {...messages.save} />
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </AsyncDataView>
    </>
  );
}
