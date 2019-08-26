import {
  Action,
  ResourceCreateAction,
  ResourceDeleteAction,
  ResourceGetAction,
  ResourceQueryAction,
  ResourceUpdateAction,
} from '@appsemble/sdk';
import { Resource } from '@appsemble/types';

import { MakeActionParameters } from '../../types';
import request, { BlobUploadType, RequestLikeActionDefinition } from './request';

interface ResourceActionDefinition<T extends Action['type'] = Action['type']>
  extends RequestLikeActionDefinition<T> {
  resource: string;
}

type ResourceCreateActionDefinition = ResourceActionDefinition<'resource.create'>;
type ResourceDeleteActionDefinition = ResourceActionDefinition<'resource.delete'>;
type ResourceGetActionDefinition = ResourceActionDefinition<'resource.get'>;
type ResourceQueryActionDefinition = ResourceActionDefinition<'resource.query'>;
type ResourceUpdateActionDefinition = ResourceActionDefinition<'resource.update'>;

function getBlobs(resource: Resource): BlobUploadType {
  const { blobs } = resource;
  const type = (blobs && blobs.type) || 'upload';
  const method = (blobs && blobs.method) || 'post';
  const url = (blobs && blobs.url) || '/api/assets';

  return { type, method, url, serialize: blobs && blobs.serialize ? blobs.serialize : null };
}

function get(args: MakeActionParameters<ResourceGetActionDefinition>): ResourceGetAction {
  const { app, definition } = args;
  const resource = app.resources[definition.resource];
  const method = (resource && resource.get && resource.get.method) || 'GET';
  const url =
    (resource && resource.get && resource.get.url) ||
    resource.url ||
    `/api/apps/${app.id}/resources/${definition.resource}`;
  const id = resource.id || 'id';

  return {
    ...request({
      ...args,
      definition: {
        ...definition,
        blobs: getBlobs(resource),
        method,
        url: `${url}${url.endsWith('/') ? '' : '/'}{${id}}`,
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
    `/api/apps/${app.id}/resources/${definition.resource}`;

  return {
    ...request({
      ...args,
      definition: {
        ...definition,
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
    `/api/apps/${app.id}/resources/${definition.resource}`;

  return {
    ...request({
      ...args,
      definition: {
        ...definition,
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
  const method = (resource && resource.update && resource.update.method) || 'POST';
  const url =
    (resource && resource.update && resource.update.url) ||
    resource.url ||
    `/api/apps/${app.id}/resources/${definition.resource}`;
  const id = resource.id || 'id';

  return {
    ...request({
      ...args,
      definition: {
        ...definition,
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
    `/api/apps/${app.id}/resources/${definition.resource}`;
  const id = resource.id || 'id';

  return {
    ...request({
      ...args,
      definition: {
        ...definition,
        blobs: getBlobs(resource),
        method,
        url: `${url}${url.endsWith('/') ? '' : '/'}{${id}}`,
        schema: resource.schema,
      },
    }),
    type: 'resource.delete',
  };
}

export default { get, query, create, update, remove };
