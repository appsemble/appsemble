import {
  createProxyDelete,
  createProxyGet,
  createProxyPatch,
  createProxyPost,
  createProxyPut,
} from '@appsemble/node-utils';
import { type Middleware } from 'koa';

import { options } from '../options/options.js';

export const proxyDelete: Middleware = createProxyDelete(options);
export const proxyGet: Middleware = createProxyGet(options);
export const proxyPatch: Middleware = createProxyPatch(options);
export const proxyPost: Middleware = createProxyPost(options);
export const proxyPut: Middleware = createProxyPut(options);
