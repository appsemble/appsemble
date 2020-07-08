import {
  Button,
  CardFooterButton,
  Form,
  Icon,
  Loader,
  Modal,
  Table,
  Title,
  useData,
  useMessages,
} from '@appsemble/react-components';
import axios from 'axios';
import React, { FormEvent, ReactElement, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useHistory, useRouteMatch } from 'react-router-dom';

import type { NamedEvent } from '../../types';
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
  mode: string;
  resourceId: string;
  resourceName: string;
}

export default function ResourceTable(): ReactElement {
  const { app } = useApp();
  const history = useHistory();
  const { formatMessage } = useIntl();
  const {
    params: { id: appId, mode, resourceName },
    url,
  } = useRouteMatch<RouteParams>();
  const push = useMessages();

  const [creatingResource, setCreatingResource] = useState<Resource>();
  const { data: resources, error, loading, setData: setResources } = useData<Resource[]>(
    `/api/apps/${appId}/resources/${resourceName}`,
  );

  const closeCreateModal = useCallback(() => {
    history.push(url.replace(`/${mode}`, ''));
  }, [history, url, mode]);

  const editResource = useCallback(
    async (resource: Resource) => {
      try {
        await axios.put<Resource>(
          `/api/apps/${appId}/resources/${resourceName}/${resource.id}`,
          resource,
        );

        setResources(resources.map((r) => (r.id === resource.id ? resource : r)));
        history.push(url.replace(`/${mode}/${resource.id}`, ''));

        push({
          body: formatMessage(messages.updateSuccess, { id: resource.id }),
          color: 'primary',
        });
      } catch (e) {
        push(formatMessage(messages.updateError));
      }
    },
    [appId, formatMessage, history, mode, push, resourceName, resources, setResources, url],
  );

  const deleteResource = useCallback(
    async (id: number) => {
      try {
        await axios.delete(`/api/apps/${appId}/resources/${resourceName}/${id}`);
        push({
          body: formatMessage(messages.deleteSuccess, { id }),
          color: 'primary',
        });
        setResources(resources.filter((resource) => resource.id !== id));
      } catch (e) {
        push(formatMessage(messages.deleteError));
      }
    },
    [appId, formatMessage, push, resourceName, resources, setResources],
  );

  const setClonable = useCallback(
    async (id: number) => {
      const resource = resources.find((r) => r.id === id);
      await axios.put(`/api/apps/${appId}/resources/${resourceName}/${id}`, {
        ...resource,
        $clonable: !resource.$clonable,
      });
      setResources(
        resources.map((r) => (r.id === id ? { ...resource, $clonable: !resource.$clonable } : r)),
      );
    },
    [appId, resourceName, resources, setResources],
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
        setCreatingResource(null);

        history.push(url.replace(`/${mode}`, ''));

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
      creatingResource,
      formatMessage,
      history,
      mode,
      push,
      resourceName,
      resources,
      setResources,
      url,
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

    const { url: resourceUrl } = app.definition.resources[resourceName];

    return (
      <FormattedMessage
        {...messages.notManaged}
        values={{
          link: (
            <a href={resourceUrl} rel="noopener noreferrer" target="_blank">
              {resourceUrl}
            </a>
          ),
        }}
      />
    );
  }

  const { schema } = app.definition.resources[resourceName];
  const keys = ['id', ...Object.keys(schema?.properties || {})];

  return (
    <>
      <HelmetIntl
        title={messages.title}
        titleValues={{ name: app.definition.name, resourceName }}
      />
      <Title>Resource {resourceName}</Title>
      <div className="buttons">
        <Link className="button is-primary" to={`${url}/new`}>
          <Icon icon="plus-square" />
          <span>
            <FormattedMessage {...messages.createButton} />
          </span>
        </Link>
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
              deleteResource={deleteResource}
              keys={keys}
              onEdit={editResource}
              resource={resource}
              schema={schema}
              setClonable={setClonable}
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
        isActive={mode === 'new'}
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
