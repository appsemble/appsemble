import {
  Button,
  CardFooterButton,
  Checkbox,
  Form,
  Icon,
  Loader,
  ModalCard,
  SimpleForm,
  SimpleFormField,
  SimpleModalFooter,
  Table,
  Title,
  useData,
  useMessages,
  useMeta,
  useToggle,
} from '@appsemble/react-components';
import { generateDataFromSchema } from '@appsemble/utils';
import { download } from '@appsemble/web-utils';
import axios from 'axios';
import { OpenAPIV3 } from 'openapi-types';
import {
  FormEvent,
  ReactElement,
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';

import { useApp } from '../../..';
import { JSONSchemaEditor } from '../../../../../../components/JSONSchemaEditor';
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

export function IndexPage(): ReactElement {
  const { app } = useApp();
  const { formatMessage } = useIntl();
  const { id: appId, resourceName } = useParams<RouteParams>();
  useMeta(resourceName);
  const push = useMessages();

  const createModal = useToggle();
  const hideModal = useToggle();

  const [[sortedProperty, sortedPropertyDirection], setSortedProperty] = useState<
    [string, 'ASC' | 'DESC']
  >(['id', 'DESC']);
  const [hiddenProperties, setHiddenProperties] = useState<Set<string>>(
    new Set(['$created', '$updated']),
  );
  const [creatingResource, setCreatingResource] = useState<Resource>();
  const { data: resources, error, loading, setData: setResources } = useData<Resource[]>(
    `/api/apps/${appId}/resources/${resourceName}?$orderby=${sortedProperty} ${sortedPropertyDirection}`,
  );

  const { schema } = app.definition.resources[resourceName];
  const keys = useMemo(() => [...Object.keys(schema?.properties || {})], [schema?.properties]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`${app.id}.${resourceName}.hiddenProperties`);
      if (saved) {
        setHiddenProperties(new Set(JSON.parse(saved)));
      }
    } catch {
      localStorage.removeItem(`${app.id}.${resourceName}.hiddenProperties`);
    }
  }, [app, resourceName]);

  const closeCreateModal = useCallback(() => {
    createModal.disable();
    setCreatingResource(null);
  }, [createModal]);

  const openCreateModal = useCallback(() => {
    setCreatingResource(generateDataFromSchema(schema) as Resource);
    createModal.enable();
  }, [createModal, schema]);

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

  const onHideProperties = useCallback(
    (values: Record<string, boolean>) => {
      const result = Object.entries(values)
        .filter(([, value]) => value)
        .map(([key]) => key);
      setHiddenProperties(new Set(result));
      localStorage.setItem(`${app.id}.${resourceName}.hiddenProperties`, JSON.stringify(result));
      hideModal.disable();
    },
    [app, hideModal, resourceName],
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

  const downloadCsv = useCallback(async () => {
    await download(
      `/api/apps/${app.id}/resources/${resourceName}?$select=${[
        'id',
        '$created',
        '$updated',
        '$author',
        ...keys,
      ]
        .filter((key) => !hiddenProperties.has(key))
        .join(',')}`,
      `${resourceName}.csv`,
      'text/csv',
    );
  }, [app, hiddenProperties, keys, resourceName]);

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
        <Button icon="eye-slash" onClick={hideModal.enable}>
          <FormattedMessage
            {...messages.hideButton}
            values={{ count: hiddenProperties.size, total: keys.length + 4 }}
          />
        </Button>
        <Button icon="download" onClick={downloadCsv}>
          <FormattedMessage {...messages.export} />
        </Button>
      </div>
      <Table>
        <thead>
          <tr>
            <th>
              <FormattedMessage {...messages.actions} />
            </th>
            {!hiddenProperties.has('id') && (
              <th className={styles.clickable} data-property="id" onClick={onSortProperty}>
                <span>
                  <FormattedMessage {...messages.id} />
                </span>
                {sortedProperty === 'id' && (
                  <Icon icon={sortedPropertyDirection === 'ASC' ? 'caret-up' : 'caret-down'} />
                )}
              </th>
            )}
            {!hiddenProperties.has('$author') && (
              <th>
                <FormattedMessage {...messages.author} />
              </th>
            )}
            {!hiddenProperties.has('$created') && (
              <th>
                <FormattedMessage {...messages.created} />
              </th>
            )}
            {!hiddenProperties.has('$updated') && (
              <th>
                <FormattedMessage {...messages.updated} />
              </th>
            )}
            {keys
              .filter((key) => !hiddenProperties.has(key))
              .map((property) => {
                const propSchema = schema?.properties[property] as OpenAPIV3.SchemaObject;
                const sortable = propSchema?.type !== 'object' && propSchema?.type !== 'array';
                return (
                  <th
                    className={sortable ? styles.clickable : ''}
                    data-property={property}
                    key={property}
                    onClick={sortable && onSortProperty}
                  >
                    <span>{propSchema?.title || property}</span>
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
              filter={hiddenProperties}
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
        isActive={createModal.enabled}
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
      <ModalCard
        component={SimpleForm}
        defaultValues={Object.fromEntries([...hiddenProperties].map((key) => [key, true]))}
        footer={
          <SimpleModalFooter
            cancelLabel={<FormattedMessage {...messages.cancelButton} />}
            onClose={hideModal.disable}
            submitLabel={<FormattedMessage {...messages.apply} />}
          />
        }
        isActive={hideModal.enabled}
        onClose={hideModal.disable}
        onSubmit={onHideProperties}
        title={<FormattedMessage {...messages.hideProperties} />}
      >
        <p>
          <FormattedMessage {...messages.hideExplanation} />
        </p>
        <br />
        <div className={styles.hideCheckboxes}>
          <SimpleFormField
            component={Checkbox}
            label={<FormattedMessage {...messages.id} />}
            name="id"
          />
          <SimpleFormField
            component={Checkbox}
            label={<FormattedMessage {...messages.author} />}
            name="$author"
          />
          <SimpleFormField
            component={Checkbox}
            label={<FormattedMessage {...messages.created} />}
            name="$created"
          />
          <SimpleFormField
            component={Checkbox}
            label={<FormattedMessage {...messages.updated} />}
            name="$updated"
          />
          {keys.map((key) => (
            <SimpleFormField
              component={Checkbox}
              key={key}
              label={(schema?.properties[key] as OpenAPIV3.SchemaObject).title ?? key}
              name={key}
            />
          ))}
        </div>
      </ModalCard>
    </>
  );
}
