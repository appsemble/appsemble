import { logger } from '@appsemble/node-utils';
import type { ActionDefinition } from '@appsemble/types';
import { formatRequestAction } from '@appsemble/utils';
import * as Boom from '@hapi/boom';
import axios from 'axios';
import { get, pick } from 'lodash';

import { App } from '../models';
import type { KoaMiddleware } from '../types';
import readPackageJson from '../utils/readPackageJson';

interface Params {
  appId: string;
  path: string;
}

const { version } = readPackageJson();

/**
 * These response headers are forwarded when proxying requests.
 */
const allowResponseHeaders = [
  'content-encoding',
  'content-length',
  'content-type',
  'transfer-encoding',
];

function createProxyHandler(useBody: boolean): KoaMiddleware<Params> {
  return async (ctx) => {
    const {
      method,
      params: { appId, path },
      query,
      request: { body },
    } = ctx;
    let data;
    if (useBody) {
      data = body;
    } else {
      try {
        data = JSON.parse(query.data);
      } catch (err) {
        throw Boom.badRequest('data should be a JSON object');
      }
    }

    const app = await App.findByPk(appId, { attributes: ['definition'] });
    if (!app) {
      throw Boom.notFound('App not found');
    }

    const action = get(app.definition, path) as ActionDefinition;
    if (action?.type !== 'request') {
      throw Boom.badRequest('path does not point to a proxyable action');
    }

    const axiosConfig = formatRequestAction(action, data);

    if (axiosConfig.method.toUpperCase() !== method) {
      throw Boom.badRequest('Method does match the request action method');
    }

    if (useBody) {
      axiosConfig.data = data;
    }
    axiosConfig.headers['user-agent'] = `AppsembleServer/${version}`;
    axiosConfig.responseType = 'stream';
    axiosConfig.validateStatus = () => true;

    let response;
    logger.verbose(`Forwarding request to ${axios.getUri(axiosConfig)}`);
    try {
      response = await axios(axiosConfig);
    } catch (err) {
      logger.error(err);
      throw Boom.badGateway();
    }

    ctx.status = response.status;
    ctx.set(pick(response.headers, allowResponseHeaders));
    ctx.body = response.data;
  };
}

export const proxyDelete = createProxyHandler(false);
export const proxyGet = createProxyHandler(false);
export const proxyPatch = createProxyHandler(true);
export const proxyPost = createProxyHandler(true);
export const proxyPut = createProxyHandler(true);
