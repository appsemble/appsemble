import { NamedEvent } from '@appsemble/web-utils';
import { ReactElement, useCallback, useEffect, useState } from 'react';
import { useMeta } from 'react-components/src/Meta';
import { Tab } from 'react-components/src/Tab';
import { Tabs } from 'react-components/src/Tabs';
import { Title } from 'react-components/src/Title';
import { useData } from 'react-components/src/useData';
import { FormattedMessage } from 'react-intl';
import { useParams } from 'react-router-dom';
import { AsyncDataView } from 'studio/src/components/AsyncDataView';
import { CodeBlock } from 'studio/src/components/CodeBlock';
import { JSONSchemaEditor } from 'studio/src/components/JSONSchemaEditor';

import { useApp } from '../../..';
import { Resource } from '../IndexPage';
import { messages } from './messages';

type TabValue = 'edit' | 'json' | 'properties';

export function ResourceDetailsPage(): ReactElement {
  const { id, resourceId, resourceName } = useParams<{
    id: string;
    resourceName: string;
    resourceId: string;
  }>();
  const { app } = useApp();
  useMeta(resourceId);
  const result = useData<Resource>(`/api/apps/${id}/resources/${resourceName}/${resourceId}`);
  const [tab, setTab] = useState<TabValue>('properties');
  const [editingResource, setEditingResource] = useState<Resource>();

  useEffect(() => {
    if (!editingResource && !result.loading && result.data) {
      setEditingResource(result.data);
    }
  }, [editingResource, result]);

  const onClickTab = useCallback((_, value: TabValue) => {
    setTab(value);
  }, []);

  const onEditChange = useCallback((event: NamedEvent, value: Resource) => {
    setEditingResource(value);
  }, []);

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
            <Tabs onChange={onClickTab} value={tab}>
              <Tab value="properties">
                <FormattedMessage {...messages.properties} />
              </Tab>
              <Tab value="json">
                <FormattedMessage {...messages.json} />
              </Tab>
              <Tab value="edit">
                <FormattedMessage {...messages.edit} />
              </Tab>
            </Tabs>
            {tab === 'properties' && <div />}
            {tab === 'json' && (
              <CodeBlock code={JSON.stringify(resource, null, 2)} language="json" />
            )}
            {tab === 'edit' && (
              <JSONSchemaEditor
                name="resource"
                onChange={onEditChange}
                schema={schema}
                value={editingResource}
              />
            )}
          </>
        )}
      </AsyncDataView>
    </>
  );
}
