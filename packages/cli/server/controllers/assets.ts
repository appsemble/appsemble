import { createCreateAsset, createGetAssetById, createGetAssets } from '@appsemble/node-utils';
import { type DefaultContext, type DefaultState, type Middleware } from 'koa';

import { options } from '../options/options.js';

export function getAssets(): Middleware<DefaultState, DefaultContext> {
  return createGetAssets(options);
}

export function getAssetById(): Middleware<DefaultState, DefaultContext> {
  return createGetAssetById(options);
}

export function createAsset(): Middleware<DefaultState, DefaultContext> {
  return createCreateAsset(options);
}
