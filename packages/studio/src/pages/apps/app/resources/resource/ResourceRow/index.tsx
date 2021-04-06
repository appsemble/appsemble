import {
  CardFooterButton,
  Form,
  IconButton,
  ModalCard,
  useConfirmation,
  useMessages,
  useToggle,
} from '@appsemble/react-components';
import { NamedEvent } from '@appsemble/web-utils';
import axios from 'axios';
import { OpenAPIV3 } from 'openapi-types';
import { ReactElement, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';

import { Resource, RouteParams } from '..';
import { useApp } from '../../..';
import { JSONSchemaEditor } from '../../../../../../components/JSONSchemaEditor';
import { ClonableCheckbox } from '../ClonableCheckbox';
import { ResourceCell } from '../ResourceCell';
import styles from './index.module.css';
import { messages } from './messages';

interface ResourceRowProps {
  resource: Resource;
  onDelete: (id: number) => void;
  onEdit: (resource: Resource) => void;
  schema: OpenAPIV3.SchemaObject;
  filter: Set<string>;
}

const filteredKeys = new Set(['id', '$author']);

export function ResourceRow({
  filter,
  onDelete,
  onEdit,
  resource,
  schema,
}: ResourceRowProps): ReactElement {
  const { id: appId, resourceName } = useParams<RouteParams>();
  const { app } = useApp();
  const [editingResource, setEditingResource] = useState<Resource>();
  const modal = useToggle();
  const push = useMessages();
  const { formatMessage } = useIntl();

  const onConfirmDelete = useCallback(
    () =>
      axios
        .delete(`/api/apps/${appId}/resources/${resourceName}/${resource.id}`)
        .then(() => {
          push({
            body: formatMessage(messages.deleteSuccess, { id: resource.id }),
            color: 'primary',
          });
          onDelete(resource.id);
        })
        .catch(() => push(formatMessage(messages.deleteError))),
    [appId, formatMessage, onDelete, push, resource, resourceName],
  );

  const handleDeleteResource = useConfirmation({
    title: <FormattedMessage {...messages.resourceWarningTitle} />,
    body: <FormattedMessage {...messages.resourceWarning} />,
    cancelLabel: <FormattedMessage {...messages.cancelButton} />,
    confirmLabel: <FormattedMessage {...messages.deleteButton} />,
    action: onConfirmDelete,
  });

  const onSetClonable = useCallback(async () => {
    const { data } = await axios.put<Resource>(
      `/api/apps/${appId}/resources/${resourceName}/${resource.id}`,
      {
        ...resource,
        $clonable: !resource.$clonable,
      },
    );
    onEdit(data);
  }, [appId, onEdit, resource, resourceName]);

  const openEditModal = useCallback(() => {
    modal.enable();
    setEditingResource(resource);
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
        `/api/apps/${appId}/resources/${resourceName}/${resource.id}`,
        editingResource,
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
    appId,
    closeEditModal,
    editingResource,
    formatMessage,
    onEdit,
    push,
    resource.id,
    resourceName,
  ]);

  return (
    <tr className={styles.root}>
      {!filter.has('$actions') && (
        <td className="is-flex">
          <IconButton color="info" icon="pen" onClick={openEditModal} />
          <IconButton className="mx-2" color="danger" icon="trash" onClick={handleDeleteResource} />
          {Object.hasOwnProperty.call(app, 'resources') && (
            <ClonableCheckbox
              checked={resource.$clonable}
              id={`clonable${resource.id}`}
              onChange={onSetClonable}
            />
          )}
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
