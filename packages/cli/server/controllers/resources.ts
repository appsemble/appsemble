import {
  createCreateResource,
  createGetResourceById,
  createQueryResources,
} from '@appsemble/node-utils/server/controllers/resources.js';

import { options } from '../options/options.js';

export const queryResources = createQueryResources(options);

export const getResourceById = createGetResourceById(options);

export const createResource = createCreateResource(options);
