import { logger } from '@appsemble/node-utils/src';
import type { ActionDefinition } from '@appsemble/types';
import * as Boom from '@hapi/boom';
import { http } from 'follow-redirects';
import { get } from 'lodash';

import { version } from '../../package.json';
import { App } from '../models';
import type { KoaContext } from '../types';

interface Params {
  appId: string;
  path: string;
}

async function proxyHandler(ctx: KoaContext<Params>): Promise<void> {
  const { appId } = ctx.params;

  const { path } = ctx.query;
  if (!path) {
    throw Boom.badRequest('Missing required query parameter: path');
  }

  const app = await App.findByPk(appId, { attributes: ['definition'] });
  if (!app) {
    throw Boom.notFound('App not found');
  }

  const action = get(app.definition, path) as ActionDefinition;
  if (!(action && 'url' in action)) {
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
        headers: { 'user-agent': `AppsembleServer/${version}` },
        method,
        path: `${url.pathname}${url.search}`,
      },
      (res) => {
        ctx.status = res.statusCode;
        ctx.set(res.headers as any);
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
