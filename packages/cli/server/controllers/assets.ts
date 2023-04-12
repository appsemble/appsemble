import {
  createGetAssetById,
  createGetAssets,
} from '@appsemble/node-utils/server/controllers/assets.js';

import { options } from '../options/options.js';

export const getAssets = createGetAssets(options);

export const getAssetById = createGetAssetById(options);
