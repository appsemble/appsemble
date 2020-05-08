import { logger } from '@appsemble/node-utils/src';
import type { ActionDefinition } from '@appsemble/types';
import * as Boom from '@hapi/boom';
import { http } from 'follow-redirects';
import { get, pick } from 'lodash';

import { App } from '../models';
import type { KoaContext } from '../types';
import readPackageJson from '../utils/readPackageJson';

interface Params {
  appId: string;
  path: string;
}

const { version } = readPackageJson();

/**
 * These request headers are forwarded when proxying requests.
 */
const allowRequestHeaders = [
  'accept',
  'accept-encoding',
  'accept-language',
  'cache-control',
  'pragma',
];

/**
 * These response headers are forwarded when proxying requests.
 */
const allowResponseHeaders = [
  'content-encoding',
  'content-length',
  'content-type',
  'transfer-encoding',
];

async function proxyHandler(ctx: KoaContext<Params>): Promise<void> {
  const { appId, path } = ctx.params;

  const app = await App.findByPk(appId, { attributes: ['definition'] });
  if (!app) {
    throw Boom.notFound('App not found');
  }

  const action = get(app.definition, path) as ActionDefinition;
  if (action?.type !== 'request') {
    throw Boom.badRequest('path does not point to a proxyable action');
  }

  const method = (action?.method ?? 'GET').toUpperCase();
  if (method !== ctx.method) {
    throw Boom.badRequest('Method does match the request action method');
  }

  const url = new URL(action.url);

  if (action.query) {
    Object.entries(action.query).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  await new Promise((resolve, reject) => {
    const connector = http.request(
      {
        host: url.hostname,
        port: url.port,
        headers: {
          'user-agent': `AppsembleServer/${version}`,
          ...pick(ctx.headers, allowRequestHeaders),
        },
        method,
        path: `${url.pathname}${url.search}`,
      },
      (res) => {
        ctx.status = res.statusCode;
        ctx.set(pick(res.headers as NodeJS.Dict<string>, allowResponseHeaders));
        ctx.status = res.statusCode;
        res.pipe(ctx.res, { end: true }).on('close', resolve);
      },
    );
    ctx.req.pipe(connector, { end: true }).on('error', (error) => {
      logger.error(error);
      reject(Boom.badGateway());
    });
  });
}

export const proxyDelete = proxyHandler;
export const proxyGet = proxyHandler;
export const proxyPatch = proxyHandler;
export const proxyPost = proxyHandler;
export const proxyPut = proxyHandler;
