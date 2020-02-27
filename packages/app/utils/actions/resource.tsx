import {
  BaseAction,
  ResourceCreateAction,
  ResourceDeleteAction,
  ResourceGetAction,
  ResourceQueryAction,
  ResourceUpdateAction,
} from '@appsemble/sdk';
import {
  BlobUploadType,
  Resource,
  ResourceCreateActionDefinition,
  ResourceDeleteActionDefinition,
  ResourceGetActionDefinition,
  ResourceQueryActionDefinition,
  ResourceSubscribeActionDefinition,
  ResourceUpdateActionDefinition,
} from '@appsemble/types';
import axios from 'axios';

import { MakeActionParameters } from '../../types';
import settings from '../settings';
import { requestLikeAction } from './request';

function getBlobs(resource: Resource): BlobUploadType {
  const { blobs } = resource;
  const type = (blobs && blobs.type) || 'upload';
  const method = (blobs && blobs.method) || 'post';
  const url = (blobs && blobs.url) || `/api/apps/${settings.id}/assets`;

  return { type, method, url, serialize: blobs && blobs.serialize ? blobs.serialize : null };
}

function get(args: MakeActionParameters<ResourceGetActionDefinition>): ResourceGetAction {
  const { app, definition } = args;
  const resource = app.resources[definition.resource];
  const method = (resource && resource.get && resource.get.method) || 'GET';
  const url =
    (resource && resource.get && resource.get.url) ||
    resource.url ||
    `/api/apps/${settings.id}/resources/${definition.resource}`;
  const { id = 'id' } = resource;

  return {
    ...requestLikeAction({
      ...args,
      definition: {
        ...definition,
        query: { ...resource?.query?.query, ...definition.query },
        blobs: getBlobs(resource),
        method,
        url: url.includes(`{${id}}`) ? url : `${url}${url.endsWith('/') ? '' : '/'}{${id}}`,
        schema: resource.schema,
      },
    }),
    type: 'resource.get',
  };
}

function query(args: MakeActionParameters<ResourceQueryActionDefinition>): ResourceQueryAction {
  const { app, definition } = args;
  const resource = app.resources[definition.resource];
  const method = (resource && resource.query && resource.query.method) || 'GET';
  const url =
    (resource && resource.query && resource.query.url) ||
    resource.url ||
    `/api/apps/${settings.id}/resources/${definition.resource}`;

  return {
    ...requestLikeAction({
      ...args,
      definition: {
        ...definition,
        query: { ...resource?.query?.query, ...definition.query },
        blobs: getBlobs(resource),
        method,
        url,
        schema: resource.schema,
      },
    }),
    type: 'resource.query',
  };
}

function create(args: MakeActionParameters<ResourceCreateActionDefinition>): ResourceCreateAction {
  const { app, definition } = args;
  const resource = app.resources[definition.resource];
  const method = (resource && resource.create && resource.create.method) || 'POST';
  const url =
    (resource && resource.create && resource.create.url) ||
    resource.url ||
    `/api/apps/${settings.id}/resources/${definition.resource}`;

  return {
    ...requestLikeAction({
      ...args,
      definition: {
        ...definition,
        query: { ...resource?.query?.query, ...definition.query },
        blobs: getBlobs(resource),
        method,
        url,
        schema: resource.schema,
      },
    }),
    type: 'resource.create',
  };
}

function update(args: MakeActionParameters<ResourceUpdateActionDefinition>): ResourceUpdateAction {
  const { app, definition } = args;
  const resource = app.resources[definition.resource];
  const method = (resource && resource.update && resource.update.method) || 'PUT';
  const url =
    (resource && resource.update && resource.update.url) ||
    resource.url ||
    `/api/apps/${settings.id}/resources/${definition.resource}`;
  const { id = 'id' } = resource;

  return {
    ...requestLikeAction({
      ...args,
      definition: {
        ...definition,
        query: { ...resource?.query?.query, ...definition.query },
        blobs: getBlobs(resource),
        method,
        url: `${url}${url.endsWith('/') ? '' : '/'}{${id}}`,
        schema: resource.schema,
      },
    }),
    type: 'resource.update',
  };
}

function remove(args: MakeActionParameters<ResourceDeleteActionDefinition>): ResourceDeleteAction {
  const { app, definition } = args;
  const resource = app.resources[definition.resource];
  const method = (resource && resource.update && resource.update.method) || 'POST';
  const url =
    (resource && resource.update && resource.update.url) ||
    resource.url ||
    `/api/apps/${settings.id}/resources/${definition.resource}`;
  const { id = 'id' } = resource;

  return {
    ...requestLikeAction({
      ...args,
      definition: {
        ...definition,
        query: { ...resource?.query?.query, ...definition.query },
        type: 'resource.delete',
        blobs: getBlobs(resource),
        method,
        url: `${url}${url.endsWith('/') ? '' : '/'}{${id}}`,
        schema: resource.schema,
      },
    }),
    type: 'resource.delete',
  };
}

function subscribe({
  app,
  definition,
  pushNotifications,
}: MakeActionParameters<ResourceSubscribeActionDefinition>): BaseAction<'resource.subscribe'> {
  const resource = app.resources[definition.resource];
  const { id = 'id' } = resource;

  return {
    dispatch: async data => {
      const { permission, requestPermission, subscribe: sub } = pushNotifications;
      let { subscription } = pushNotifications;

      if (!subscription && permission === 'default') {
        const newPermission = await requestPermission();
        if (newPermission !== 'granted') {
          throw Error('Unable to subscribe. Permission was denied.');
        }

        subscription = await sub();
      } else if (permission === 'granted' && !subscription) {
        subscription = await sub();
      } else if (permission === 'denied') {
        throw Error('Unable to subscribe. Permission was denied.');
      }

      const { endpoint } = subscription;
      await axios.patch(`${settings.apiUrl}/api/apps/${settings.id}/subscriptions`, {
        endpoint,
        resource: definition.resource,
        action: definition.action || 'update',
        value: true,
        resourceId: data[id],
      });

      return data;
    },
    type: 'resource.subscribe',
  };
}

export default { get, query, create, update, remove, subscribe };
