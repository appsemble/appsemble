import {
  Button,
  CardFooterButton,
  Form,
  Icon,
  Loader,
  ModalCard,
  Table,
  Title,
  useData,
  useMessages,
  useMeta,
  useToggle,
} from '@appsemble/react-components';
import { generateDataFromSchema } from '@appsemble/utils';
import axios from 'axios';
import { OpenAPIV3 } from 'openapi-types';
import { FormEvent, ReactElement, SyntheticEvent, useCallback, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';

import { useApp } from '../..';
import { JSONSchemaEditor } from '../../../../../components/JSONSchemaEditor';
import styles from './index.module.css';
import { messages } from './messages';
import { ResourceRow } from './ResourceRow';

export interface Resource {
  id: number;
  $clonable: boolean;
  $created: string;
  $updated: string;
  $author?: {
    id: string;
    name: string;
  };
  [key: string]: unknown;
}

export interface RouteParams {
  id: string;
  resourceName: string;
}

export function ResourcePage(): ReactElement {
  const { app } = useApp();
  const { formatMessage } = useIntl();
  const { id: appId, resourceName } = useParams<RouteParams>();
  useMeta(resourceName);
  const push = useMessages();

  const modal = useToggle();
  const [[sortedProperty, sortedPropertyDirection], setSortedProperty] = useState<
    [string, 'ASC' | 'DESC']
  >(['id', 'DESC']);
  const [creatingResource, setCreatingResource] = useState<Resource>();
  const { data: resources, error, loading, setData: setResources } = useData<Resource[]>(
    `/api/apps/${appId}/resources/${resourceName}?$orderby=${sortedProperty} ${sortedPropertyDirection}`,
  );

  const { schema } = app.definition.resources[resourceName];
  const keys = useMemo(() => [...Object.keys(schema?.properties || {})], [schema?.properties]);

  const closeCreateModal = useCallback(() => {
    modal.disable();
    setCreatingResource(null);
  }, [modal]);

  const openCreateModal = useCallback(() => {
    setCreatingResource(generateDataFromSchema(schema) as Resource);
    modal.enable();
  }, [modal, schema]);

  const onEditResource = useCallback(
    (resource: Resource) => {
      setResources(resources.map((r) => (r.id === resource.id ? resource : r)));
    },
    [resources, setResources],
  );

  const onDeleteResource = useCallback(
    (id: number) => {
      setResources(resources.filter((resource) => resource.id !== id));
    },
    [resources, setResources],
  );

  const onChange = useCallback((event, value: Resource) => {
    setCreatingResource(value);
  }, []);

  const onSortProperty = useCallback(
    (event: SyntheticEvent<HTMLTableHeaderCellElement>) => {
      const { property } = event.currentTarget.dataset;

      if (property === sortedProperty) {
        setSortedProperty([property, sortedPropertyDirection === 'ASC' ? 'DESC' : 'ASC']);
      } else {
        setSortedProperty([property, 'ASC']);
      }
    },
    [sortedProperty, sortedPropertyDirection],
  );

  const submitCreate = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();

      try {
        const { data } = await axios.post<Resource>(
          `/api/apps/${appId}/resources/${resourceName}`,
          creatingResource,
        );

        setResources([...resources, data]);
        closeCreateModal();

        push({
          body: formatMessage(messages.createSuccess, { id: data.id }),
          color: 'primary',
        });
      } catch {
        push(formatMessage(messages.createError));
      }
    },
    [
      appId,
      closeCreateModal,
      creatingResource,
      formatMessage,
      push,
      resourceName,
      resources,
      setResources,
    ],
  );

  if (!app || loading) {
    return <Loader />;
  }

  if (error) {
    return <FormattedMessage {...messages.loadError} />;
  }

  if (!loading && resources === undefined) {
    if (!Object.hasOwnProperty.call(app.definition.resources, resourceName)) {
      return <FormattedMessage {...messages.notFound} />;
    }

    const { url } = app.definition.resources[resourceName];

    return (
      <FormattedMessage
        {...messages.notManaged}
        values={{
          link: (
            <a href={url} rel="noopener noreferrer" target="_blank">
              {url}
            </a>
          ),
        }}
      />
    );
  }

  return (
    <>
      <Title>
        <FormattedMessage {...messages.header} values={{ resourceName }} />
      </Title>
      <div className="buttons">
        <Button className="is-primary" icon="plus-square" onClick={openCreateModal}>
          <FormattedMessage {...messages.createButton} />
        </Button>
        <Button
          component="a"
          download={`${resourceName}.csv`}
          href={`/api/apps/${app.id}/resources/${resourceName}`}
          icon="download"
        >
          <FormattedMessage {...messages.export} />
        </Button>
      </div>
      <Table>
        <thead>
          <tr>
            <th>
              <FormattedMessage {...messages.actions} />
            </th>
            <th className={styles.clickable} data-property="id" onClick={onSortProperty}>
              <FormattedMessage {...messages.id} />
              {sortedProperty === 'id' && (
                <Icon icon={sortedPropertyDirection === 'ASC' ? 'caret-up' : 'caret-down'} />
              )}
            </th>
            <th>
              <FormattedMessage {...messages.author} />
            </th>
            {keys.map((property) => {
              const propSchema = schema?.properties[property] as OpenAPIV3.SchemaObject;
              const sortable = propSchema?.type !== 'object' && propSchema?.type !== 'array';
              return (
                <th
                  className={sortable ? styles.clickable : ''}
                  data-property={property}
                  key={property}
                  onClick={sortable && onSortProperty}
                >
                  {propSchema?.title || property}
                  {sortedProperty === property && (
                    <Icon icon={sortedPropertyDirection === 'ASC' ? 'caret-up' : 'caret-down'} />
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {resources.map((resource) => (
            <ResourceRow
              key={resource.id}
              onDelete={onDeleteResource}
              onEdit={onEditResource}
              resource={resource}
              schema={schema}
            />
          ))}
        </tbody>
      </Table>
      <ModalCard
        cardClassName={styles.modal}
        component={Form}
        footer={
          <>
            <CardFooterButton onClick={closeCreateModal}>
              <FormattedMessage {...messages.cancelButton} />
            </CardFooterButton>
            <CardFooterButton color="primary" type="submit">
              <FormattedMessage {...messages.createButton} />
            </CardFooterButton>
          </>
        }
        isActive={modal.enabled}
        onClose={closeCreateModal}
        onSubmit={submitCreate}
        title={<FormattedMessage {...messages.newTitle} values={{ resource: resourceName }} />}
      >
        <JSONSchemaEditor
          name="resource"
          onChange={onChange}
          schema={schema}
          value={creatingResource}
        />
      </ModalCard>
    </>
  );
}
