import {
  Button,
  Checkbox,
  FileUpload,
  Icon,
  ModalCard,
  PaginationNavigator,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleModalFooter,
  Table,
  useConfirmation,
  useData,
  useMessages,
  useToggle,
} from '@appsemble/react-components';
import { type Resource } from '@appsemble/types';
import { generateDataFromSchema, has, serializeResource } from '@appsemble/utils';
import { download } from '@appsemble/web-utils';
import axios from 'axios';
import classNames from 'classnames';
import { type OpenAPIV3 } from 'openapi-types';
import {
  type ChangeEvent,
  type ReactNode,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { ResourceRow } from './ResourceRow/index.js';
import { AsyncDataView } from '../../../../../../components/AsyncDataView/index.js';
import { HeaderControl } from '../../../../../../components/HeaderControl/index.js';
import { JSONSchemaEditor } from '../../../../../../components/JSONSchemaEditor/index.js';
import { useApp } from '../../../index.js';

const defaultHiddenProperties = new Set(['$created', '$updated', '$editor']);

export function IndexPage({
  isInGui,
  providedResourceName,
  rootClassName,
  showResourceDefinition,
  tableDivClassName,
  triggerShowDetails,
}: {
  readonly rootClassName?: string;
  readonly tableDivClassName?: string;
  readonly providedResourceName?: string;
  readonly isInGui?: boolean;
  readonly showResourceDefinition?: () => void;
  readonly triggerShowDetails?: (passedResourceId: string) => void;
}): ReactNode {
  const { app } = useApp();
  const { formatMessage } = useIntl();
  let { resourceName } = useParams<{
    id: string;
    resourceName: string;
  }>();

  if (providedResourceName) {
    resourceName = providedResourceName;
  }

  const [searchParams, setSearchParams] = useSearchParams();
  const push = useMessages();

  const createModal = useToggle();
  const hideModal = useToggle();
  const advancedOptionsModal = useToggle();
  const importModal = useToggle();

  const defaultAdvancedOptions = new Set([]);

  if (app?.demoMode) {
    defaultAdvancedOptions.add('$ephemeral');
  }
  if (app?.template) {
    defaultAdvancedOptions.add('$clonable');
  }

  const resourceURL = `/api/apps/${app.id}/resources/${resourceName}`;
  const hiddenPropertiesKey = `${app.id}.${resourceName}.hiddenProperties`;
  const advancedOptionsKey = `${app.id}.${resourceName}.advancedOptions`;

  const [hiddenProperties, setHiddenProperties] = useState(defaultHiddenProperties);
  const [selectedResources, setSelectedResources] = useState<number[]>([]);
  const [advancedOptions, setAdvancedOptions] = useState(defaultAdvancedOptions);

  const orderBy = searchParams.get('order') || 'id';
  const orderDirection: 'ASC' | 'DESC' =
    searchParams.get('direction') == null
      ? 'DESC'
      : (searchParams.get('direction') as 'ASC' | 'DESC');
  const offset = Math.max(Number(searchParams.get('offset')), 0);
  const limit =
    searchParams.get('limit') === 'none'
      ? Number.POSITIVE_INFINITY
      : Math.max(Number(searchParams.get('limit')), 15);
  const rowsPerPage = limit;
  const page = limit === Number.POSITIVE_INFINITY ? 1 : Math.floor(offset / limit) + 1;

  const resultCount = useData<number>(`${resourceURL}/$count`);
  const result = useData<Resource[]>(
    `${resourceURL}?${new URLSearchParams({
      $filter: [...advancedOptions].map((item) => `${item} eq true`).join(' or '),
      $orderby: `${orderBy} ${orderDirection}`,
      $skip: String(offset),
      ...(Number.isFinite(limit) && { $top: String(limit) }),
    })}`,
  );
  const count = resultCount.data;
  const setResources = result.setData;

  const { schema } = app.definition.resources[resourceName];
  const keys = Object.keys(schema.properties);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(hiddenPropertiesKey);
      const savedAdvancedOptions = localStorage.getItem(advancedOptionsKey);
      if (saved) {
        setHiddenProperties(new Set(JSON.parse(saved)));
      }
      if (savedAdvancedOptions) {
        setAdvancedOptions(new Set(JSON.parse(savedAdvancedOptions)));
      }
    } catch {
      localStorage.removeItem(hiddenPropertiesKey);
      localStorage.removeItem(advancedOptionsKey);
    }
  }, [advancedOptionsKey, hiddenPropertiesKey]);

  const updatePagination = useCallback(
    (newCount: number) => {
      const newPage =
        rowsPerPage === Number.POSITIVE_INFINITY
          ? 1
          : page >= Math.ceil(newCount / rowsPerPage)
            ? Math.ceil(newCount / rowsPerPage)
            : page;
      setSearchParams(
        Number.isFinite(rowsPerPage)
          ? {
              limit: String(rowsPerPage),
              offset: String(Math.max(newPage - 1, 0) * rowsPerPage),
              ...(searchParams.get('order') && { order: searchParams.get('order') }),
              ...(searchParams.get('direction') && { direction: searchParams.get('direction') }),
            }
          : {
              limit: 'none',
              offset: '0',
              ...(searchParams.get('order') && { order: searchParams.get('order') }),
              ...(searchParams.get('direction') && { direction: searchParams.get('direction') }),
            },
      );
      resultCount.setData(newCount);
    },
    [page, resultCount, rowsPerPage, searchParams, setSearchParams],
  );

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
      updatePagination(count - 1);
    },
    [count, setResources, updatePagination],
  );

  const onConfirmDelete = useCallback(async () => {
    try {
      await axios.delete(resourceURL, { data: selectedResources });
      setResources((resources) =>
        resources.filter((resource) => !selectedResources.includes(Number(resource.id))),
      );
      updatePagination(count - selectedResources.length);
      setSelectedResources([]);
      push({
        body: formatMessage(messages.deleteSuccess),
        color: 'primary',
      });
    } catch {
      push(formatMessage(messages.deleteError));
    }
  }, [count, formatMessage, push, resourceURL, selectedResources, setResources, updatePagination]);

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
      selected.length === result.data?.length ? [] : result.data?.map((r) => r.id),
    );
  }, [result]);

  const onSortProperty = useCallback(
    (event: SyntheticEvent<HTMLTableCellElement>) => {
      const { property } = event.currentTarget.dataset;

      if (property === orderBy) {
        setSearchParams({
          ...(searchParams.get('limit') && { limit: searchParams.get('limit') }),
          ...(searchParams.get('offset') && { offset: searchParams.get('offset') }),
          direction: orderDirection === 'ASC' ? 'DESC' : 'ASC',
          order: orderBy,
        });
      } else {
        setSearchParams({
          ...(searchParams.get('limit') && { limit: searchParams.get('limit') }),
          ...(searchParams.get('offset') && { offset: searchParams.get('offset') }),
          order: property,
          direction: 'ASC',
        });
      }
    },
    [orderBy, orderDirection, searchParams, setSearchParams],
  );

  const onToggleAdvancedOptions = useCallback(
    (values: Record<string, boolean>) => {
      const newAdvancedOptions = Object.entries(values)
        .filter(([, value]) => value)
        .map(([key]) => key);
      setAdvancedOptions(new Set(newAdvancedOptions));
      localStorage.setItem(advancedOptionsKey, JSON.stringify(newAdvancedOptions));
      advancedOptionsModal.disable();
    },
    [advancedOptionsModal, advancedOptionsKey, setAdvancedOptions],
  );
  const onImportCsv = useCallback(
    ({ delimiter, file }: { file: File; delimiter: string }) => {
      axios
        .post<Resource[]>(resourceURL, file, {
          headers: { 'content-type': file.type },
          params: { delimiter },
        })
        .then(
          ({ data }) => {
            const newResources = [].concat(data);
            setResources((oldResources) => [...newResources, ...oldResources]);
            updatePagination(count + newResources.length);
            importModal.disable();
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
    },
    [count, formatMessage, importModal, push, resourceURL, setResources, updatePagination],
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
      updatePagination(count + 1);

      createModal.disable();
      push({
        body: formatMessage(messages.createSuccess, { id: data.id }),
        color: 'primary',
      });
    },
    [
      count,
      createModal,
      formatMessage,
      push,
      resourceName,
      resourceURL,
      setResources,
      updatePagination,
    ],
  );

  const downloadCsv = useCallback(async () => {
    const newSearchParams = new URLSearchParams({
      $filter: [...advancedOptions].map((item) => `${item} eq true`).join(' or '),
    });
    newSearchParams.set(
      '$select',
      ['id', '$created', '$updated', '$author', ...keys]
        .filter((key) => !hiddenProperties.has(key))
        .join(','),
    );
    await download(`${resourceURL}?${newSearchParams}`, `${resourceName}.csv`, 'text/csv');
  }, [advancedOptions, hiddenProperties, keys, resourceName, resourceURL]);

  const onPageChange = useCallback(
    (updatedPage: number) => {
      setSelectedResources([]);
      setSearchParams(
        Number.isFinite(rowsPerPage)
          ? {
              limit: String(rowsPerPage),
              offset: String((updatedPage - 1) * rowsPerPage),
              ...(searchParams.get('order') && { order: searchParams.get('order') }),
              ...(searchParams.get('direction') && { direction: searchParams.get('direction') }),
            }
          : {
              limit: 'none',
              offset: '0',
              ...(searchParams.get('order') && { order: searchParams.get('order') }),
              ...(searchParams.get('direction') && { direction: searchParams.get('direction') }),
            },
      );
    },
    [rowsPerPage, searchParams, setSearchParams],
  );

  const onRowsPerPageChange = useCallback(
    (updatedRowsPerPage: number) => {
      setSelectedResources([]);
      setSearchParams(
        Number.isFinite(updatedRowsPerPage)
          ? {
              limit: String(updatedRowsPerPage),
              offset: String(offset - (offset % updatedRowsPerPage)),
              ...(searchParams.get('order') && { order: searchParams.get('order') }),
              ...(searchParams.get('direction') && { direction: searchParams.get('direction') }),
            }
          : {
              limit: 'none',
              offset: '0',
              ...(searchParams.get('order') && { order: searchParams.get('order') }),
              ...(searchParams.get('direction') && { direction: searchParams.get('direction') }),
            },
      );
    },
    [offset, searchParams, setSearchParams],
  );

  return (
    <div className={rootClassName}>
      <HeaderControl
        control={
          isInGui ? (
            <Button icon="book" onClick={showResourceDefinition}>
              <FormattedMessage {...messages.api} />
            </Button>
          ) : (
            <Button component={Link} icon="book" to="details">
              <FormattedMessage {...messages.api} />
            </Button>
          )
        }
        titleClassName="title is-4"
      >
        <FormattedMessage {...messages.header} values={{ resourceName }} />
      </HeaderControl>
      <div className={classNames('buttons mb-1 pt-3', styles.buttons)}>
        <Button className="is-primary" icon="plus-square" onClick={createModal.enable}>
          <FormattedMessage {...messages.createButton} />
        </Button>
        <Button icon="eye-slash" onClick={hideModal.enable}>
          <FormattedMessage
            {...messages.hideButton}
            values={{ count: hiddenProperties.size, total: keys.length + 4 }}
          />
        </Button>
        <Button icon="cogs" onClick={advancedOptionsModal.enable}>
          <FormattedMessage {...messages.advancedOptions} />
        </Button>
        <Button icon="download" onClick={downloadCsv}>
          <FormattedMessage {...messages.export} />
        </Button>
        <Button icon="upload" onClick={importModal.enable}>
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
          <div className={classNames(styles.tableDiv, tableDivClassName)}>
            <Table className={styles.table} fullwidth={false}>
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
                      {orderBy === 'id' && (
                        <Icon icon={orderDirection === 'ASC' ? 'caret-up' : 'caret-down'} />
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
                      const sortable =
                        propSchema?.type !== 'object' && propSchema?.type !== 'array';
                      return (
                        <th
                          className={sortable ? styles.clickable : ''}
                          data-property={property}
                          key={property}
                          onClick={sortable ? onSortProperty : null}
                        >
                          <span>{propSchema?.title || property}</span>
                          {orderBy === property && (
                            <Icon icon={orderDirection === 'ASC' ? 'caret-up' : 'caret-down'} />
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
                    guiResourceName={providedResourceName}
                    isInGui={isInGui}
                    key={resource.id}
                    onDelete={onDeleteResource}
                    onEdit={onEditResource}
                    onSelected={onCheckboxClick}
                    resource={resource}
                    schema={schema}
                    selected={selectedResources.includes(resource.id)}
                    triggerShowDetails={triggerShowDetails}
                  />
                ))}
              </tbody>
            </Table>

            <PaginationNavigator
              count={count}
              onPageChange={onPageChange}
              onRowsPerPageChange={onRowsPerPageChange}
              page={page}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[15, 25, 100, 500, Number.POSITIVE_INFINITY]}
            />
          </div>
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
        <SimpleFormField component={JSONSchemaEditor} name={resourceName} schema={schema} />
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
      <ModalCard
        component={SimpleForm}
        defaultValues={Object.fromEntries([...advancedOptions].map((key) => [key, true]))}
        footer={
          <SimpleModalFooter
            cancelLabel={<FormattedMessage {...messages.cancelButton} />}
            onClose={advancedOptionsModal.disable}
            submitLabel={<FormattedMessage {...messages.apply} />}
          />
        }
        isActive={advancedOptionsModal.enabled}
        onClose={advancedOptionsModal.disable}
        onSubmit={onToggleAdvancedOptions}
        title={<FormattedMessage {...messages.advancedOptions} />}
      >
        <p>
          <FormattedMessage {...messages.advancedOptionsExplanation} />
        </p>
        <br />
        <div className={styles.hideCheckboxes}>
          <SimpleFormField
            component={Checkbox}
            label={<FormattedMessage {...messages.seed} />}
            name="$seed"
          />
          <SimpleFormField
            component={Checkbox}
            label={<FormattedMessage {...messages.ephemeral} />}
            name="$ephemeral"
          />
          <SimpleFormField
            component={Checkbox}
            label={<FormattedMessage {...messages.clonable} />}
            name="$clonable"
          />
        </div>
      </ModalCard>
      <ModalCard
        component={SimpleForm}
        defaultValues={{
          file: null,
          delimiter: ',',
        }}
        footer={
          <SimpleModalFooter
            cancelLabel={<FormattedMessage {...messages.cancelButton} />}
            onClose={importModal.disable}
            submitLabel={<FormattedMessage {...messages.import} />}
          />
        }
        isActive={importModal.enabled}
        onClose={() => importModal.disable}
        onSubmit={onImportCsv}
        title={<FormattedMessage {...messages.import} />}
      >
        <SimpleFormError>{() => <FormattedMessage {...messages.importError} />}</SimpleFormError>
        <SimpleFormField
          accept="text/csv, application/json"
          component={FileUpload}
          fileButtonLabel={<FormattedMessage {...messages.chooseFile} />}
          fileLabel={<FormattedMessage {...messages.noFile} />}
          label={<FormattedMessage {...messages.file} />}
          name="file"
          required
        />
        <SimpleFormField
          help={
            <FormattedMessage
              {...messages.delimiterHelp}
              values={{ bold: (value) => <strong>{value}</strong> }}
            />
          }
          label={<FormattedMessage {...messages.delimiter} />}
          name="delimiter"
        />
      </ModalCard>
    </div>
  );
}
