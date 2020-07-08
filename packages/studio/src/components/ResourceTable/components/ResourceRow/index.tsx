import {
  Button,
  CardFooterButton,
  Form,
  Icon,
  Modal,
  useConfirmation,
} from '@appsemble/react-components/src';
import type { OpenAPIV3 } from 'openapi-types';
import type { NamedEvent } from 'packages/studio/src/types';
import React, { ReactElement, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, useHistory, useRouteMatch } from 'react-router-dom';

import type { Resource, RouteParams } from '../..';
import JSONSchemaEditor from '../../../JSONSchemaEditor';
import ClonableCheckbox from '../ClonableCheckbox';
import styles from './index.css';
import messages from './messages';

interface ResourceRowProps {
  resource: Resource;
  keys: string[];
  deleteResource: (id: number) => Promise<void>;
  setClonable: (id: number) => Promise<void>;
  onEdit: (resource: Resource) => Promise<void>;
  schema: OpenAPIV3.SchemaObject;
}
export default function ResourceRow({
  deleteResource,
  keys,
  onEdit,
  resource,
  schema,
  setClonable,
}: ResourceRowProps): ReactElement {
  const {
    params: { mode, resourceId, resourceName },
    url,
  } = useRouteMatch<RouteParams>();
  const history = useHistory();

  const [editingResource, setEditingResource] = useState({ ...resource });

  const handleDeleteResource = useConfirmation({
    title: <FormattedMessage {...messages.resourceWarningTitle} />,
    body: <FormattedMessage {...messages.resourceWarning} />,
    cancelLabel: <FormattedMessage {...messages.cancelButton} />,
    confirmLabel: <FormattedMessage {...messages.deleteButton} />,
    action: () => deleteResource(resource.id),
  });

  const handleSetClonable = useCallback(
    () => new Promise<void>((resolve) => setClonable(resource.id).then(resolve)),
    [resource.id, setClonable],
  );

  const closeEditModal = useCallback(() => {
    history.push(url.replace(`/${mode}/${resource.id}`, ''));
    setEditingResource(resource);
  }, [history, url, mode, resource]);

  const onEditChange = useCallback((_event: NamedEvent, value: any) => {
    setEditingResource(value);
  }, []);

  const onEditSubmit = useCallback(() => {
    onEdit(editingResource).then(closeEditModal);
  }, [closeEditModal, editingResource, onEdit]);

  return (
    <>
      <tr key={resource.id}>
        <td>
          <div className={styles.actionsCell}>
            <Link className="button" to={`${url}/edit/${resource.id}`}>
              <Icon className="has-text-info" icon="pen" size="small" />
            </Link>
            <Button color="danger" icon="trash" inverted onClick={handleDeleteResource} />
            <ClonableCheckbox
              checked={resource.$clonable}
              id={`clonable${resource.id}`}
              onChange={handleSetClonable}
            />
          </div>
        </td>
        {keys.map((key) => (
          <td key={key} className={styles.contentCell}>
            {typeof resource[key] === 'string' ? resource[key] : JSON.stringify(resource[key])}
          </td>
        ))}
      </tr>
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
        isActive={mode === 'edit' && resourceId === `${resource.id}`}
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
    </>
  );
}
