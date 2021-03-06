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
  useConfirmation,
  useData,
  useMessages,
  useToggle,
} from '@appsemble/react-components';
import { Resource } from '@appsemble/types';
import { generateDataFromSchema } from '@appsemble/utils';
import { download } from '@appsemble/web-utils';
import axios from 'axios';
import { OpenAPIV3 } from 'openapi-types';
import {
  ChangeEvent,
  FormEvent,
  ReactElement,
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useParams, useRouteMatch } from 'react-router-dom';

import { useApp } from '../../..';
import { HeaderControl } from '../../../../../../components/HeaderControl';
import { JSONSchemaEditor } from '../../../../../../components/JSONSchemaEditor';
import styles from './index.module.css';
import { messages } from './messages';
import { ResourceRow } from './ResourceRow';

export interface RouteParams {
  id: string;
  resourceName: string;
}

export function IndexPage(): ReactElement {
  const { app } = useApp();
  const { formatMessage } = useIntl();
  const { id: appId, resourceName } = useParams<RouteParams>();
  const push = useMessages();
  const { url: routeUrl } = useRouteMatch();

  const createModal = useToggle();
  const hideModal = useToggle();

  const [[sortedProperty, sortedPropertyDirection], setSortedProperty] = useState<
    [string, 'ASC' | 'DESC']
  >(['id', 'DESC']);
  const [hiddenProperties, setHiddenProperties] = useState<Set<string>>(
    new Set(['$created', '$updated']),
  );
  const [selectedResources, setSelectedResources] = useState<number[]>([]);
  const [creatingResource, setCreatingResource] = useState<Resource>();
  const {
    data: resources,
    error,
    loading,
    setData: setResources,
  } = useData<Resource[]>(
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
    (resourceId: number) => {
      setResources((r) => r.filter((res) => res.id !== resourceId));
    },
    [setResources],
  );

  const onConfirmDelete = useCallback(async () => {
    try {
      await Promise.all(
        selectedResources.map((resource) =>
          axios.delete(`/api/apps/${appId}/resources/${resourceName}/${resource}`),
        ),
      );
      setResources(
        resources.filter((resource) => !selectedResources.includes(Number(resource.id))),
      );
      setSelectedResources([]);
      push({
        body: formatMessage(messages.deleteSuccess),
        color: 'primary',
      });
    } catch {
      push(formatMessage(messages.deleteError));
    }
  }, [appId, formatMessage, push, resourceName, resources, selectedResources, setResources]);

  const onDelete = useConfirmation({
    title: <FormattedMessage {...messages.resourceWarningTitle} />,
    body: (
      <FormattedMessage
        {...messages.resourceWarning}
        values={{ amount: selectedResources.length }}
      />
    ),
    cancelLabel: <FormattedMessage {...messages.cancelButton} />,
    confirmLabel: <FormattedMessage {...messages.deleteButton} />,
    action: onConfirmDelete,
  });

  const onCheckboxClick = useCallback(
    (event: ChangeEvent<HTMLInputElement>, checked: boolean) => {
      const id = event.currentTarget.name;

      if (checked) {
        setSelectedResources([...selectedResources, Number(id)]);
      } else {
        setSelectedResources(selectedResources.filter((a) => a !== Number(id)));
      }
    },
    [selectedResources],
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
      <HeaderControl
        control={
          <Button component={Link} icon="book" to={`${routeUrl}/details`}>
            <FormattedMessage {...messages.api} />
          </Button>
        }
      >
        <FormattedMessage {...messages.header} values={{ resourceName }} />
      </HeaderControl>

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
        <Button
          color="danger"
          disabled={selectedResources.length === 0}
          icon="trash-alt"
          onClick={onDelete}
        >
          <FormattedMessage {...messages.delete} values={{ amount: selectedResources.length }} />
        </Button>
      </div>
      <Table className="is-flex-grow-1 is-flex-shrink-1">
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
            {Object.hasOwnProperty.call(app, 'resources') && !hiddenProperties.has('$clonable') && (
              <th>
                <FormattedMessage {...messages.clonable} />
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
          {resources.map((resource, index) => (
            <ResourceRow
              dropdownUp={resources.length > 2 && index >= resources.length - 2}
              filter={hiddenProperties}
              key={resource.id}
              onDelete={onDeleteResource}
              onEdit={onEditResource}
              onSelected={onCheckboxClick}
              resource={resource}
              schema={schema}
              selected={selectedResources.includes(resource.id)}
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
          {Object.hasOwnProperty.call(app, 'resources') && (
            <SimpleFormField
              component={Checkbox}
              label={<FormattedMessage {...messages.clonable} />}
              name="$clonable"
            />
          )}
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
