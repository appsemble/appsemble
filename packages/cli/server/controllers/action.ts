import {
  createProxyDelete,
  createProxyGet,
  createProxyPatch,
  createProxyPost,
  createProxyPut,
} from '@appsemble/node-utils';
import { type DefaultContext, type DefaultState, type Middleware } from 'koa';

import { options } from '../options/options.js';

export function proxyDelete(): Middleware<DefaultContext, DefaultState> {
  return createProxyDelete(options);
}

export function proxyGet(): Middleware<DefaultContext, DefaultState> {
  return createProxyGet(options);
}

export function proxyPatch(): Middleware<DefaultContext, DefaultState> {
  return createProxyPatch(options);
}

export function proxyPost(): Middleware<DefaultContext, DefaultState> {
  return createProxyPost(options);
}

export function proxyPut(): Middleware<DefaultContext, DefaultState> {
  return createProxyPut(options);
}
