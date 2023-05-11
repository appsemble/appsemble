import { createCreateAsset, createGetAssetById, createGetAssets } from '@appsemble/node-utils';
import { type Middleware } from 'koa';

import { options } from '../options/options.js';

export const getAssets: Middleware = createGetAssets(options);
export const getAssetById: Middleware = createGetAssetById(options);
export const createAsset: Middleware = createCreateAsset(options);
