import {
  Button,
  CardFooterButton,
  Form,
  Icon,
  Input,
  Loader,
  Modal,
  useMessages,
  useToggle,
} from '@appsemble/react-components';
import axios from 'axios';
import { OpenAPIV3 } from 'openapi-types';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useHistory, useRouteMatch } from 'react-router-dom';

import { useApp } from '../AppContext';
import HelmetIntl from '../HelmetIntl';
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

export default function ResourceTable(): React.ReactElement {
  const { app } = useApp();

  const history = useHistory();
  const intl = useIntl();
  const match = useRouteMatch<RouteParams>();
  const push = useMessages();

  const [resources, setResources] = React.useState<Resource[]>();
  const [deletingResource, setDeletingResource] = React.useState<Resource>();
  const [editingResource, setEditingResource] = React.useState<Resource>();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const warningDialog = useToggle();

  const { id: appId, mode, resourceId, resourceName } = match.params;

  const promptDeleteResource = React.useCallback(
    (resource: Resource) => {
      setDeletingResource(resource);
      warningDialog.enable();
    },
    [warningDialog],
  );

  const closeModal = React.useCallback(() => {
    history.push(match.url.replace(`/${mode}${mode === 'edit' ? `/${resourceId}` : ''}`, ''));
  }, [history, match.url, mode, resourceId]);

  const deleteResource = React.useCallback(async () => {
    try {
      await axios.delete(`/api/apps/${appId}/resources/${resourceName}/${deletingResource.id}`);
      push({
        body: intl.formatMessage(messages.deleteSuccess, { id: deletingResource.id }),
        color: 'primary',
      });
      setResources(resources.filter((resource) => resource.id !== deletingResource.id));
      setDeletingResource(undefined);
      warningDialog.disable();
    } catch (e) {
      push(intl.formatMessage(messages.deleteError));
    }
  }, [appId, deletingResource, intl, push, resourceName, resources, warningDialog]);

  const onChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>, value: string) => {
      const { name } = event.target;
      if (name === 'id') {
        return;
      }
      const { type } = app.definition.resources[resourceName].schema.properties[
        name
      ] as OpenAPIV3.SchemaObject;
      setEditingResource({
        ...editingResource,
        [name]: type === 'object' || type === 'array' ? JSON.parse(value) : value,
      });
    },
    [app, editingResource, resourceName],
  );

  const submitCreate = React.useCallback(
    async (event: React.FormEvent) => {
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
          body: intl.formatMessage(messages.createSuccess, { id: data.id }),
          color: 'primary',
        });
      } catch (e) {
        push(intl.formatMessage(messages.createError));
      }
    },
    [appId, editingResource, history, intl, match.url, mode, push, resourceName, resources],
  );

  const submitEdit = React.useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
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
          body: intl.formatMessage(messages.createSuccess, { id: resourceId }),
          color: 'primary',
        });
      } catch (e) {
        push(intl.formatMessage(messages.createError));
      }
    },
    [
      appId,
      editingResource,
      history,
      intl,
      match.url,
      mode,
      push,
      resourceId,
      resourceName,
      resources,
    ],
  );

  const download = React.useCallback(async () => {
    const { data } = await axios.get(`/api/apps/${app.id}/resources/${resourceName}`, {
      responseType: 'blob',
      headers: {
        Accept: 'text/csv',
      },
    });

    const downloadUrl = URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${resourceName}.csv`;
    link.click();
    URL.revokeObjectURL(downloadUrl);
  }, [app, resourceName]);

  React.useEffect(() => {
    if (app.definition.resources[resourceName]?.schema) {
      setLoading(true);
      setError(false);
      axios
        .get<Resource[]>(`/api/apps/${app.id}/resources/${resourceName}`)
        .then(({ data }) => setResources(data))
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
      setResources(undefined);
    }
  }, [app, resourceName]);

  React.useEffect(() => {
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
      <h1 className="title">Resource {resourceName}</h1>
      <div className="buttons">
        <Link className="button is-primary" to={`${match.url}/new`}>
          <Icon icon="plus-square" />
          <span>
            <FormattedMessage {...messages.createButton} />
          </span>
        </Link>
        <Button icon="download" onClick={download}>
          <FormattedMessage {...messages.export} />
        </Button>
      </div>
      <div className="table-container">
        <table className="table is-striped is-hoverable is-fullwidth">
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
                    onClick={() => promptDeleteResource(resource)}
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
        </table>
      </div>
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
        {keys.map((key) => {
          const prop = (schema?.properties[key] || {}) as OpenAPIV3.SchemaObject;
          let value = '';
          let type: React.ComponentPropsWithoutRef<typeof Input>['type'] = 'text';

          if (editingResource?.[key]) {
            value = editingResource[key];
            if (typeof value === 'object') {
              value = JSON.stringify(value);
            }
          }

          if (prop.type === 'integer' || prop.type === 'number') {
            type = 'number';
          } else if (prop.format === 'email') {
            type = 'email';
          } else if (prop.format === 'password') {
            type = 'password';
          }

          return (
            <Input
              key={key}
              disabled={prop.readOnly || key === 'id'}
              label={
                prop.title ? (
                  <>
                    {`${prop.title} `}
                    <span className="has-text-weight-normal has-text-grey-light">({key})</span>
                  </>
                ) : (
                  key
                )
              }
              name={key}
              onChange={onChange}
              placeholder={prop.example}
              required={schema?.required?.includes(key)}
              type={type}
              value={value}
            />
          );
        })}
      </Modal>
      <Modal
        footer={
          <>
            <CardFooterButton onClick={warningDialog.disable}>
              <FormattedMessage {...messages.cancelButton} />
            </CardFooterButton>
            <CardFooterButton color="danger" onClick={deleteResource}>
              <FormattedMessage {...messages.deleteButton} />
            </CardFooterButton>
          </>
        }
        isActive={warningDialog.enabled}
        onClose={warningDialog.disable}
        title={<FormattedMessage {...messages.resourceWarningTitle} />}
      >
        <FormattedMessage {...messages.resourceWarning} />
      </Modal>
    </>
  );
}
