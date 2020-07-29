import { logger } from '@appsemble/node-utils';
import type { ActionDefinition, EmailActionDefinition } from '@appsemble/types';
import { formatRequestAction, remap } from '@appsemble/utils';
import * as Boom from '@hapi/boom';
import axios from 'axios';
import type { ParameterizedContext } from 'koa';
import { get, pick } from 'lodash';

import { App } from '../models';
import type { AppsembleContext, AppsembleState, KoaMiddleware } from '../types';
import { getRemapperContext } from '../utils/app';
import renderEmail from '../utils/email/renderEmail';
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

const supportedActions = ['email', 'request'];

async function handleEmail(
  ctx: ParameterizedContext<AppsembleState, AppsembleContext<Params>>,
  app: App,
  action: EmailActionDefinition,
): Promise<void> {
  const {
    mailer,
    method,
    request: { body: data },
  } = ctx;
  if (method !== 'POST') {
    throw Boom.methodNotAllowed('Method must be POST for email actions');
  }

  const context = await getRemapperContext(app, app.definition.defaultLanguage || 'en-us');
  const to = remap(action.to, data, context);
  const body = remap(action.body, data, context);
  const sub = remap(action.subject, data, context);

  if (!to || !sub || !body) {
    throw Boom.badRequest('Fields “to”, “subject”, and “body” must be a valid string');
  }

  const { html, subject, text } = await renderEmail(body, {}, sub);
  await mailer.sendEmail(to, subject, html, text);

  ctx.status = 204;
}

async function handleRequestProxy(
  ctx: ParameterizedContext<AppsembleState, AppsembleContext<Params>>,
  action: ActionDefinition,
  useBody: boolean,
): Promise<void> {
  const {
    method,
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
}

function createProxyHandler(useBody: boolean): KoaMiddleware<Params> {
  return async (ctx) => {
    const {
      params: { appId, path },
    } = ctx;
    const app = await App.findByPk(appId, { attributes: ['definition'] });
    if (!app) {
      throw Boom.notFound('App not found');
    }

    const appAction = get(app.definition, path) as ActionDefinition;
    const action = supportedActions.find((act) => act === appAction?.type);

    switch (action) {
      case 'email':
        return handleEmail(ctx, app, appAction as EmailActionDefinition);
      case 'request':
        return handleRequestProxy(ctx, appAction, useBody);
      default:
        throw Boom.badRequest('path does not point to a proxyable action');
    }
  };
}

export const proxyDelete = createProxyHandler(false);
export const proxyGet = createProxyHandler(false);
export const proxyPatch = createProxyHandler(true);
export const proxyPost = createProxyHandler(true);
export const proxyPut = createProxyHandler(true);
