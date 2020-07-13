import {
  Button,
  CardFooterButton,
  Form,
  Modal,
  useConfirmation,
  useMessages,
  useToggle,
} from '@appsemble/react-components';
import type { NamedEvent } from '@appsemble/web-utils';
import axios from 'axios';
import type { OpenAPIV3 } from 'openapi-types';
import React, { ReactElement, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useRouteMatch } from 'react-router-dom';

import type { Resource, RouteParams } from '../..';
import { useApp } from '../../../AppContext';
import JSONSchemaEditor from '../../../JSONSchemaEditor';
import ClonableCheckbox from '../ClonableCheckbox';
import styles from './index.css';
import messages from './messages';

interface ResourceRowProps {
  resource: Resource;
  onDelete: (id: number) => void;
  onEdit: (resource: Resource) => void;
  schema: OpenAPIV3.SchemaObject;
}
export default function ResourceRow({
  onDelete,
  onEdit,
  resource,
  schema,
}: ResourceRowProps): ReactElement {
  const {
    params: { id: appId, resourceName },
  } = useRouteMatch<RouteParams>();
  const { app } = useApp();
  const [editingResource, setEditingResource] = useState<Resource>();
  const modal = useToggle();
  const push = useMessages();
  const { formatMessage } = useIntl();

  const onConfirmDelete = useCallback(() => {
    axios
      .delete(`/api/apps/${appId}/resources/${resourceName}/${resource.id}`)
      .then(() => {
        push({
          body: formatMessage(messages.deleteSuccess, { id: resource.id }),
          color: 'primary',
        });
        onDelete(resource.id);
      })
      .catch(() => push(formatMessage(messages.deleteError)));
  }, [appId, formatMessage, onDelete, push, resource, resourceName]);

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

  const onEditChange = useCallback((_event: NamedEvent, value: any) => {
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
    <tr>
      <td>
        <div className={styles.actionsCell}>
          <Button className="has-text-info" icon="pen" onClick={openEditModal} />
          <Button color="danger" icon="trash" inverted onClick={handleDeleteResource} />
          {Object.prototype.hasOwnProperty.call(app, 'resources') && (
            <ClonableCheckbox
              checked={resource.$clonable}
              id={`clonable${resource.id}`}
              onChange={onSetClonable}
            />
          )}
        </div>
        <Modal
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
        </Modal>
      </td>
      <td className={styles.contentCell}>{resource.id}</td>
      {Object.keys(schema?.properties ?? {})
        .filter((key) => key !== 'id')
        .map((key) => (
          <td key={key} className={styles.contentCell}>
            {typeof resource[key] === 'string' ? resource[key] : JSON.stringify(resource[key])}
          </td>
        ))}
    </tr>
  );
}
