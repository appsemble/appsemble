import {
  createProxyDelete,
  createProxyGet,
  createProxyPatch,
  createProxyPost,
  createProxyPut,
} from '@appsemble/node-utils';
import { type DefaultContext, type DefaultState, type Middleware } from 'koa';

import { options } from '../options/options.js';

export function proxyDelete(): Middleware<DefaultState, DefaultContext> {
  return createProxyDelete(options);
}

export function proxyGet(): Middleware<DefaultState, DefaultContext> {
  return createProxyGet(options);
}

export function proxyPatch(): Middleware<DefaultState, DefaultContext> {
  return createProxyPatch(options);
}

export function proxyPost(): Middleware<DefaultState, DefaultContext> {
  return createProxyPost(options);
}

export function proxyPut(): Middleware<DefaultState, DefaultContext> {
  return createProxyPut(options);
}
