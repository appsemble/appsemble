import {
  createCountResources,
  createCreateResource,
  createDeleteResource,
  createGetResourceById,
  createQueryResources,
  createUpdateResource,
} from '@appsemble/node-utils';
import { type Middleware } from 'koa';

import { options } from '../options/options.js';

export const createResource: Middleware = createCreateResource(options);
export const countResources: Middleware = createCountResources(options);
export const getResourceById: Middleware = createGetResourceById(options);
export const queryResources: Middleware = createQueryResources(options);
export const updateResource: Middleware = createUpdateResource(options);
export const deleteResource: Middleware = createDeleteResource(options);
