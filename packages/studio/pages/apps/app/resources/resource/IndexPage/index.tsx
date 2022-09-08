import {
  Button,
  Checkbox,
  Icon,
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
import { generateDataFromSchema, has } from '@appsemble/utils';
import { download, serializeResource } from '@appsemble/web-utils';
import axios from 'axios';
import { OpenAPIV3 } from 'openapi-types';
import {
  ChangeEvent,
  ReactElement,
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useParams } from 'react-router-dom';

import { AsyncDataView } from '../../../../../../components/AsyncDataView/index.js';
import { HeaderControl } from '../../../../../../components/HeaderControl/index.js';
import { JSONSchemaEditor } from '../../../../../../components/JSONSchemaEditor/index.js';
import { useApp } from '../../../index.js';
import styles from './index.module.css';
import { messages } from './messages.js';
import { ResourceRow } from './ResourceRow/index.js';

export interface RouteParams {
  lang: string;
  id: string;
  resourceName: string;
}

const defaultHiddenProperties = new Set(['$created', '$updated', '$editor']);

export function IndexPage(): ReactElement {
  const { app } = useApp();
  const { formatMessage } = useIntl();
  const { id: appId, lang, resourceName } = useParams<RouteParams>();
  const routeUrl = `/${lang}/apps/${appId}/resources/${resourceName}`;
  const push = useMessages();

  const createModal = useToggle();
  const hideModal = useToggle();

  const resourceURL = `/api/apps/${appId}/resources/${resourceName}`;
  const hiddenPropertiesKey = `${appId}.${resourceName}.hiddenProperties`;

  // eslint-disable-next-line react/hook-use-state
  const [[sortedProperty, sortedPropertyDirection], setSortedProperty] = useState<
    [string, 'ASC' | 'DESC']
  >(['id', 'DESC']);
  const [hiddenProperties, setHiddenProperties] = useState(defaultHiddenProperties);
  const [selectedResources, setSelectedResources] = useState<number[]>([]);
  const result = useData<Resource[]>(
    `${resourceURL}?$orderby=${sortedProperty} ${sortedPropertyDirection}`,
  );
  const setResources = result.setData;

  const { schema } = app.definition.resources[resourceName];
  const keys = Object.keys(schema.properties);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(hiddenPropertiesKey);
      if (saved) {
        setHiddenProperties(new Set(JSON.parse(saved)));
      }
    } catch {
      localStorage.removeItem(hiddenPropertiesKey);
    }
  }, [hiddenPropertiesKey]);

  const defaultResourceValues = useMemo(() => generateDataFromSchema(schema) as Resource, [schema]);

  const onEditResource = useCallback(
    (resource: Resource) => {
      setResources((resources) => resources.map((r) => (r.id === resource.id ? resource : r)));
    },
    [setResources],
  );

  const onDeleteResource = useCallback(
    (resourceId: number) => {
      setResources((r) => r.filter((res) => res.id !== resourceId));
    },
    [setResources],
  );

  const onConfirmDelete = useCallback(async () => {
    try {
      await axios.delete(resourceURL, { data: selectedResources });
      setResources((resources) =>
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
  }, [formatMessage, push, resourceURL, selectedResources, setResources]);

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

  const onSelectAll = useCallback(() => {
    setSelectedResources((selected) =>
      selected.length === result.data?.length ? [] : result.data.map((resource) => resource.id),
    );
  }, [result]);

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
      const newHiddenProperties = Object.entries(values)
        .filter(([, value]) => value)
        .map(([key]) => key);
      setHiddenProperties(new Set(newHiddenProperties));
      localStorage.setItem(hiddenPropertiesKey, JSON.stringify(newHiddenProperties));
      hideModal.disable();
    },
    [hiddenPropertiesKey, hideModal],
  );

  const submitCreate = useCallback(
    async (values: Record<string, Resource>) => {
      const { data } = await axios.post<Resource>(
        resourceURL,
        serializeResource(values[resourceName]),
      );

      setResources((resources) => [...resources, data]);

      createModal.disable();
      push({
        body: formatMessage(messages.createSuccess, { id: data.id }),
        color: 'primary',
      });
    },
    [createModal, formatMessage, push, resourceName, resourceURL, setResources],
  );

  const downloadCsv = useCallback(async () => {
    const url = new URL(resourceURL, window.location.origin);
    url.searchParams.set(
      '$select',
      ['id', '$created', '$updated', '$author', ...keys]
        .filter((key) => !hiddenProperties.has(key))
        .join(','),
    );
    await download(String(url), `${resourceName}.csv`, 'text/csv');
  }, [hiddenProperties, keys, resourceName, resourceURL]);

  const uploadCsv = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'text/csv, application/json';
    input.click();
    input.addEventListener('change', () => {
      const [file] = input.files;
      axios
        .post<Resource[]>(resourceURL, file, {
          headers: { 'content-type': file.type },
        })
        .then(
          ({ data }) => {
            const newResources = [].concat(data);
            setResources((oldResources) => [...newResources, ...oldResources]);
            push({
              body: formatMessage(messages.importSuccess, {
                ids: newResources.map((r) => r.id).join(', '),
              }) as string,
              color: 'success',
            });
          },
          () => {
            push({
              body: formatMessage(messages.importError),
              color: 'danger',
            });
          },
        );
    });
  }, [formatMessage, push, resourceURL, setResources]);

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
        <Button className="is-primary" icon="plus-square" onClick={createModal.enable}>
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
        <Button icon="upload" onClick={uploadCsv}>
          <FormattedMessage {...messages.import} />
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
      <AsyncDataView
        emptyMessage={
          <p className="pt-6">
            <FormattedMessage {...messages.empty} values={{ type: resourceName }} />
          </p>
        }
        errorMessage={<FormattedMessage {...messages.loadError} />}
        loadingMessage={<FormattedMessage {...messages.loading} values={{ type: resourceName }} />}
        result={result}
      >
        {(resources) => (
          <Table className="is-flex-grow-1 is-flex-shrink-1">
            <thead>
              <tr>
                <th className={`pl-2 ${styles.noWrap}`}>
                  <Checkbox
                    className={`pr-2 is-inline-block ${styles.boolean} `}
                    indeterminate={
                      selectedResources.length
                        ? selectedResources.length !== result.data?.length
                        : null
                    }
                    name="select-all"
                    onChange={onSelectAll}
                    value={selectedResources.length === result.data?.length}
                  />
                  <span className="is-inline-block">
                    <FormattedMessage {...messages.actions} />
                  </span>
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
                {!hiddenProperties.has('$editor') && (
                  <th>
                    <FormattedMessage {...messages.editor} />
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
                {has(app, 'resources') && !hiddenProperties.has('$clonable') ? (
                  <th>
                    <FormattedMessage {...messages.clonable} />
                  </th>
                ) : null}
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
                        onClick={sortable ? onSortProperty : null}
                      >
                        <span>{propSchema?.title || property}</span>
                        {sortedProperty === property && (
                          <Icon
                            icon={sortedPropertyDirection === 'ASC' ? 'caret-up' : 'caret-down'}
                          />
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
        )}
      </AsyncDataView>
      <ModalCard
        cardClassName={styles.modal}
        component={SimpleForm}
        defaultValues={defaultResourceValues}
        footer={
          <SimpleModalFooter
            cancelLabel={<FormattedMessage {...messages.cancelButton} />}
            onClose={createModal.disable}
            submitLabel={<FormattedMessage {...messages.createButton} />}
          />
        }
        isActive={createModal.enabled}
        onClose={createModal.disable}
        onSubmit={submitCreate}
        title={<FormattedMessage {...messages.newTitle} values={{ resource: resourceName }} />}
      >
        <SimpleFormField
          // @ts-expect-error This is working as expected.
          component={JSONSchemaEditor}
          name={resourceName}
          schema={schema}
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
          {has(app, 'resources') && (
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
              label={(schema.properties[key] as OpenAPIV3.SchemaObject).title ?? key}
              name={key}
            />
          ))}
        </div>
      </ModalCard>
    </>
  );
}
