import {
  AsyncCheckbox,
  Button,
  CardFooterButton,
  Checkbox,
  Dropdown,
  Form,
  ModalCard,
  useConfirmation,
  useMessages,
  useToggle,
} from '@appsemble/react-components';
import { type Resource } from '@appsemble/types';
import { has, serializeResource } from '@appsemble/utils';
import { type NamedEvent } from '@appsemble/web-utils';
import axios from 'axios';
import classNames from 'classnames';
import { type OpenAPIV3 } from 'openapi-types';
import { type ChangeEvent, type ReactNode, useCallback, useState } from 'react';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import { Link, useParams } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { JSONSchemaEditor } from '../../../../../../../components/JSONSchemaEditor/index.js';
import { useApp } from '../../../../index.js';
import { ResourceCell } from '../ResourceCell/index.js';

interface ResourceRowProps {
  /**
   * Whether or not the dropdown for actions should be up.
   */
  readonly dropdownUp: boolean;

  /**
   * The resource to display the data of.
   */
  readonly resource: Resource;

  /**
   * The callback for when an existing resource is edited.
   */
  readonly onEdit: (resource: Resource) => void;

  /**
   * The callback for when an existing resource is deleted.
   */
  readonly onDelete: (id: number) => void;

  /**
   * The overloaded passed down toggle from the GUI editor.
   */
  readonly triggerShowDetails?: (passedResourceId: string) => void;

  /**
   * The JSON schema of the resource.
   */
  readonly schema: OpenAPIV3.SchemaObject;

  /**
   * Whether the checkbox for this resource row is selected.
   */
  readonly selected: boolean;

  /**
   * A callback function that is triggered when the checkbox is changed.
   */
  readonly onSelected: (event: ChangeEvent<HTMLInputElement>, checked: boolean) => void;

  /**
   * The list of properties to hide.
   */
  readonly filter: Set<string>;

  /**
   * Whether it is rendered within the GUI editor
   */
  readonly isInGui?: boolean;

  /**
   * Pass along the resource name from the GUI editor `Resources` tab
   */
  readonly guiResourceName?: string;
}

const filteredKeys = new Set(['id', '$author']);

/**
 * Display a resource in a table row.
 */
export function ResourceRow({
  dropdownUp,
  filter,
  guiResourceName,
  isInGui,
  onDelete,
  onEdit,
  onSelected,
  resource,
  schema,
  selected,
  triggerShowDetails: showResourceDetails,
}: ResourceRowProps): ReactNode {
  const { resourceName: paramResourceName } = useParams<{
    resourceName: string;
  }>();
  const resourceName: string = guiResourceName || paramResourceName;

  const { app } = useApp();
  const [editingResource, setEditingResource] = useState<Record<string, unknown>>();
  const modal = useToggle();
  const push = useMessages();
  const { formatMessage } = useIntl();

  const onSetClonable = useCallback(async () => {
    const { $author, $clonable, $created, $updated, ...rest } = resource;
    const { data } = await axios.put<Resource>(
      `/api/apps/${app.id}/resources/${resourceName}/${resource.id}`,
      {
        ...rest,
        $clonable: !$clonable,
      },
    );
    onEdit(data);
  }, [app.id, onEdit, resource, resourceName]);

  const openEditModal = useCallback(() => {
    modal.enable();
    const { $author, $clonable, $created, $updated, Position, id, ...rest } = resource;
    setEditingResource(rest);
  }, [modal, resource]);

  const closeEditModal = useCallback(() => {
    modal.disable();
    setEditingResource(null);
  }, [modal]);

  const onEditChange = useCallback((event: NamedEvent, value: Resource) => {
    setEditingResource(value);
  }, []);

  const onEditSubmit = useCallback(async () => {
    try {
      const { data } = await axios.put<Resource>(
        `/api/apps/${app.id}/resources/${resourceName}/${resource.id}`,
        serializeResource(editingResource),
      );
      push({
        body: formatMessage(messages.updateSuccess, { id: resource.id }),
        color: 'primary',
      });
      onEdit(data);
      closeEditModal();
    } catch {
      push(formatMessage(messages.updateError));
    }
  }, [
    app.id,
    closeEditModal,
    editingResource,
    formatMessage,
    onEdit,
    push,
    resource.id,
    resourceName,
  ]);

  const onConfirmDelete = useCallback(
    () =>
      axios
        .delete(`/api/apps/${app.id}/resources/${resourceName}/${resource.id}`)
        .then(() => {
          push({
            body: formatMessage(messages.deleteSuccess, { id: resource.id }),
            color: 'primary',
          });
          onDelete(resource.id);
        })
        .catch(() => push(formatMessage(messages.deleteError))),
    [app.id, formatMessage, onDelete, push, resource, resourceName],
  );

  const handleDeleteResource = useConfirmation({
    title: <FormattedMessage {...messages.resourceWarningTitle} />,
    body: <FormattedMessage {...messages.resourceWarning} />,
    cancelLabel: <FormattedMessage {...messages.cancelButton} />,
    confirmLabel: <FormattedMessage {...messages.deleteButton} />,
    action: onConfirmDelete,
  });

  return (
    <tr className={styles.root}>
      {!filter.has('$actions') && (
        <td className={`is-flex is-paddingless ${styles.actionCell}`}>
          <Checkbox
            className={`px-2 py-2 is-inline-block ${styles.boolean}`}
            name={String(resource.id)}
            onChange={onSelected}
            value={selected}
          />
          <Dropdown
            className={classNames(styles.dropdown, { 'is-up': dropdownUp })}
            dropdownIcon="ellipsis-v"
            label=""
          >
            <Button
              className={`${styles.noBorder} pl-5 dropdown-item`}
              icon="pen"
              onClick={openEditModal}
            >
              <FormattedMessage {...messages.edit} />
            </Button>
            <hr className="dropdown-divider" />
            {isInGui ? (
              <Button
                className={`${styles.noBorder} pl-5 dropdown-item`}
                icon="book"
                onClick={() => showResourceDetails(String(resource.id))}
              >
                <FormattedMessage {...messages.details} />
              </Button>
            ) : (
              <Button
                className={`${styles.noBorder} pl-5 dropdown-item`}
                component={Link}
                icon="book"
                to={`${resource.id}#properties`}
              >
                <FormattedMessage {...messages.details} />
              </Button>
            )}
            <hr className="dropdown-divider" />
            <Button
              className={`${styles.noBorder} pl-5 dropdown-item`}
              color="danger"
              icon="trash-alt"
              inverted
              onClick={handleDeleteResource}
            >
              <FormattedMessage {...messages.deleteButton} />
            </Button>
          </Dropdown>
          <ModalCard
            cardClassName={styles.modal}
            component={Form}
            footer={
              <>
                <CardFooterButton onClick={closeEditModal}>
                  <FormattedMessage {...messages.cancelButton} />
                </CardFooterButton>
                <CardFooterButton color="primary" type="submit">
                  <FormattedMessage {...messages.editButton} />
                </CardFooterButton>
              </>
            }
            isActive={modal.enabled}
            onClose={closeEditModal}
            onSubmit={onEditSubmit}
            title={
              <FormattedMessage
                {...messages.editTitle}
                values={{ resource: resourceName, id: resource.id }}
              />
            }
          >
            <JSONSchemaEditor
              name="resource"
              onChange={onEditChange}
              schema={schema}
              value={editingResource}
            />
          </ModalCard>
        </td>
      )}
      {!filter.has('id') && <td className={styles.id}>{resource.id}</td>}
      {!filter.has('$author') && (
        <td className={styles.author}>{resource.$author?.name ?? resource.$author?.id}</td>
      )}
      {!filter.has('$editor') && (
        <td className={styles.author}>{resource.$editor?.name ?? resource.$editor?.id}</td>
      )}
      {!filter.has('$created') && (
        <td>
          <time dateTime={resource.$created}>
            <FormattedDate day="numeric" month="short" value={resource.$created} year="numeric" />
          </time>
        </td>
      )}

      {!filter.has('$updated') && (
        <td>
          <time dateTime={resource.$updated}>
            <FormattedDate day="numeric" month="short" value={resource.$updated} year="numeric" />
          </time>
        </td>
      )}

      {has(app, 'resources') && !filter.has('$clonable') ? (
        <td>
          <AsyncCheckbox
            id={`clonable${resource.id}`}
            onChange={onSetClonable}
            value={resource.$clonable ?? false}
          />
        </td>
      ) : null}

      {Object.entries(schema?.properties ?? {})
        .filter(([key]) => !filteredKeys.has(key) && !filter.has(key))
        .map(([key, subSchema]) => (
          <ResourceCell
            key={key}
            required={Boolean(schema.required?.includes(key))}
            schema={subSchema}
            value={resource[key]}
          />
        ))}
    </tr>
  );
}
