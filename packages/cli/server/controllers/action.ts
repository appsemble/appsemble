import {
  createProxyDelete,
  createProxyGet,
  createProxyPatch,
  createProxyPost,
  createProxyPut,
} from '@appsemble/node-utils/server/controllers/action.js';

import { options } from '../../options/options.js';

export const proxyDelete = createProxyDelete(options);
export const proxyGet = createProxyGet(options);
export const proxyPatch = createProxyPatch(options);
export const proxyPost = createProxyPost(options);
export const proxyPut = createProxyPut(options);
