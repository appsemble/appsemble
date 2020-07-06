import {
  Button,
  CardFooterButton,
  Form,
  Icon,
  Loader,
  Modal,
  Table,
  Title,
  useConfirmation,
  useData,
  useMessages,
} from '@appsemble/react-components';
import type { NamedEvent } from '@appsemble/web-utils';
import axios from 'axios';
import React, { FormEvent, ReactElement, useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useHistory, useRouteMatch } from 'react-router-dom';

import download from '../../utils/download';
import { useApp } from '../AppContext';
import HelmetIntl from '../HelmetIntl';
import JSONSchemaEditor from '../JSONSchemaEditor';
import styles from './index.css';
import messages from './messages';

interface Resource {
  id: number;
  [key: string]: any;
}

interface RouteParams {
  id: string;
  mode: string;
  resourceId: string;
  resourceName: string;
}

export default function ResourceTable(): ReactElement {
  const { app } = useApp();

  const history = useHistory();
  const { formatMessage } = useIntl();
  const match = useRouteMatch<RouteParams>();
  const push = useMessages();

  const [editingResource, setEditingResource] = useState<Resource>();

  const { id: appId, mode, resourceId, resourceName } = match.params;

  const { data: resources, error, loading, setData: setResources } = useData<Resource[]>(
    `/api/apps/${appId}/resources/${resourceName}`,
  );

  const closeModal = useCallback(() => {
    history.push(match.url.replace(`/${mode}${mode === 'edit' ? `/${resourceId}` : ''}`, ''));
  }, [history, match.url, mode, resourceId]);

  const deleteResource = useConfirmation({
    title: <FormattedMessage {...messages.resourceWarningTitle} />,
    body: <FormattedMessage {...messages.resourceWarning} />,
    cancelLabel: <FormattedMessage {...messages.cancelButton} />,
    confirmLabel: <FormattedMessage {...messages.deleteButton} />,
    async action(deletingResource: Resource) {
      try {
        await axios.delete(`/api/apps/${appId}/resources/${resourceName}/${deletingResource.id}`);
        push({
          body: formatMessage(messages.deleteSuccess, { id: deletingResource.id }),
          color: 'primary',
        });
        setResources(resources.filter((resource) => resource.id !== deletingResource.id));
      } catch (e) {
        push(formatMessage(messages.deleteError));
      }
    },
  });

  const onChange = useCallback((_event: NamedEvent, value: any) => {
    setEditingResource(value);
  }, []);

  const submitCreate = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();

      try {
        const { data } = await axios.post<Resource>(
          `/api/apps/${appId}/resources/${resourceName}`,
          editingResource,
        );

        setResources([...resources, data]);
        setEditingResource(null);

        history.push(match.url.replace(`/${mode}`, ''));

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
      editingResource,
      formatMessage,
      history,
      match,
      mode,
      push,
      resourceName,
      resources,
      setResources,
    ],
  );

  const submitEdit = useCallback(async () => {
    try {
      await axios.put<Resource>(
        `/api/apps/${appId}/resources/${resourceName}/${resourceId}`,
        editingResource,
      );

      setResources(
        resources.map((resource) =>
          resource.id === editingResource.id ? editingResource : resource,
        ),
      );
      setEditingResource(null);

      history.push(match.url.replace(`/${mode}/${resourceId}`, ''));

      push({
        body: formatMessage(messages.updateSuccess, { id: resourceId }),
        color: 'primary',
      });
    } catch (e) {
      push(formatMessage(messages.updateError));
    }
  }, [
    appId,
    editingResource,
    formatMessage,
    history,
    match,
    mode,
    push,
    resourceId,
    resourceName,
    resources,
    setResources,
  ]);

  const downloadCsv = useCallback(async () => {
    await download(
      `/api/apps/${app.id}/resources/${resourceName}`,
      `${resourceName}.csv`,
      'text/csv',
    );
  }, [app, resourceName]);

  useEffect(() => {
    if (resources && mode === 'edit') {
      setEditingResource(resources.find((resource) => resource.id === Number(resourceId)));
    }
  }, [mode, resourceId, resources]);

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
        <Link className="button is-primary" to={`${match.url}/new`}>
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
            <tr key={resource.id}>
              <td className={styles.actionsCell}>
                <Link className="button" to={`${match.url}/edit/${resource.id}`}>
                  <Icon className="has-text-info" icon="pen" size="small" />
                </Link>
                <Button
                  color="danger"
                  icon="trash"
                  inverted
                  onClick={() => deleteResource(resource)}
                />
              </td>
              {keys.map((key) => (
                <td key={key} className={styles.contentCell}>
                  {typeof resource[key] === 'string'
                    ? resource[key]
                    : JSON.stringify(resource[key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
      <Modal
        component={Form}
        footer={
          <>
            <CardFooterButton onClick={closeModal}>
              <FormattedMessage {...messages.cancelButton} />
            </CardFooterButton>
            <CardFooterButton color="primary" type="submit">
              {mode === 'edit' ? (
                <FormattedMessage {...messages.editButton} />
              ) : (
                <FormattedMessage {...messages.createButton} />
              )}
            </CardFooterButton>
          </>
        }
        isActive={mode === 'edit' || mode === 'new'}
        onClose={closeModal}
        onSubmit={mode === 'edit' ? submitEdit : submitCreate}
        title={
          mode === 'edit' ? (
            <FormattedMessage
              {...messages.editTitle}
              values={{ resource: resourceName, id: resourceId }}
            />
          ) : (
            <FormattedMessage {...messages.newTitle} values={{ resource: resourceName }} />
          )
        }
      >
        <JSONSchemaEditor
          name="resource"
          onChange={onChange}
          schema={schema}
          value={editingResource}
        />
      </Modal>
    </>
  );
}
