import {
  createCountResources,
  createCreateResource,
  createDeleteResource,
  createGetResourceById,
  createQueryResources,
  createUpdateResource,
} from '@appsemble/node-utils/server/controllers/resources.js';

import { options } from '../options/options.js';

export const createResource = createCreateResource(options);

export const countResources = createCountResources(options);

export const getResourceById = createGetResourceById(options);

export const queryResources = createQueryResources(options);

export const updateResource = createUpdateResource(options);

export const deleteResource = createDeleteResource(options);
