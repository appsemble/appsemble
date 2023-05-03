import {
  createCountResources,
  createCreateResource,
  createDeleteResource,
  createGetResourceById,
  createQueryResources,
  createUpdateResource,
} from '@appsemble/node-utils';
import { type DefaultContext, type DefaultState, type Middleware } from 'koa';

import { options } from '../options/options.js';

export function createResource(): Middleware<DefaultContext, DefaultState> {
  return createCreateResource(options);
}

export function countResources(): Middleware<DefaultContext, DefaultState> {
  return createCountResources(options);
}

export function getResourceById(): Middleware<DefaultContext, DefaultState> {
  return createGetResourceById(options);
}

export function queryResources(): Middleware<DefaultContext, DefaultState> {
  return createQueryResources(options);
}

export function updateResource(): Middleware<DefaultContext, DefaultState> {
  return createUpdateResource(options);
}

export function deleteResource(): Middleware<DefaultContext, DefaultState> {
  return createDeleteResource(options);
}
