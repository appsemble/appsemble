import {
  Button,
  CardFooterButton,
  Form,
  Loader,
  Modal,
  Table,
  Title,
  useData,
  useMessages,
  useToggle,
} from '@appsemble/react-components';
import type { NamedEvent } from '@appsemble/web-utils';
import axios from 'axios';
import React, { FormEvent, ReactElement, useCallback, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';

import download from '../../utils/download';
import { useApp } from '../AppContext';
import HelmetIntl from '../HelmetIntl';
import JSONSchemaEditor from '../JSONSchemaEditor';
import ResourceRow from './components/ResourceRow';
import messages from './messages';

export interface Resource {
  id: number;
  $clonable: boolean;
  [key: string]: any;
}

export interface RouteParams {
  id: string;
  resourceName: string;
}

export default function ResourceTable(): ReactElement {
  const { app } = useApp();
  const { formatMessage } = useIntl();
  const { id: appId, resourceName } = useParams<RouteParams>();
  const push = useMessages();

  const modal = useToggle();
  const [creatingResource, setCreatingResource] = useState<Resource>();
  const { data: resources, error, loading, setData: setResources } = useData<Resource[]>(
    `/api/apps/${appId}/resources/${resourceName}`,
  );

  const { schema } = app.definition.resources[resourceName];
  const keys = useMemo(() => ['id', ...Object.keys(schema?.properties || {})], [
    schema?.properties,
  ]);

  const closeCreateModal = useCallback(() => {
    modal.disable();
    setCreatingResource(null);
  }, [modal]);

  const onEditResource = useCallback(
    (resource: Resource) => {
      setResources(resources.map((r) => (r.id === resource.id ? resource : r)));
    },
    [resources, setResources],
  );

  const onDeleteResource = useCallback(
    async (id: number) => {
      setResources(resources.filter((resource) => resource.id !== id));
    },
    [resources, setResources],
  );

  const onChange = useCallback((_event: NamedEvent, value: any) => {
    setCreatingResource(value);
  }, []);

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
      } catch (e) {
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
      `/api/apps/${app.id}/resources/${resourceName}`,
      `${resourceName}.csv`,
      'text/csv',
    );
  }, [app, resourceName]);

  if (!app || loading) {
    return <Loader />;
  }

  if (error) {
    return <FormattedMessage {...messages.loadError} />;
  }

  if (!loading && resources === undefined) {
    if (!Object.prototype.hasOwnProperty.call(app.definition.resources, resourceName)) {
      return (
        <>
          <HelmetIntl
            title={messages.title}
            titleValues={{ name: app.definition.name, resourceName }}
          />
          <FormattedMessage {...messages.notFound} />
        </>
      );
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
      <HelmetIntl
        title={messages.title}
        titleValues={{ name: app.definition.name, resourceName }}
      />
      <Title>Resource {resourceName}</Title>
      <div className="buttons">
        <Button className="is-primary" icon="plus-square" onClick={modal.enable}>
          <span>
            <FormattedMessage {...messages.createButton} />
          </span>
        </Button>
        <Button icon="download" onClick={downloadCsv}>
          <FormattedMessage {...messages.export} />
        </Button>
      </div>
      <Table>
        <thead>
          <tr>
            <th>Actions</th>
            {keys.map((property) => (
              <th key={property}>{property}</th>
            ))}
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
      <Modal
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
      </Modal>
    </>
  );
}
