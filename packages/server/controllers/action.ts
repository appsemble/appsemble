import { logger } from '@appsemble/node-utils';
import {
  ActionDefinition,
  EmailActionDefinition,
  RequestLikeActionDefinition,
} from '@appsemble/types';
import { defaultLocale, formatRequestAction, remap } from '@appsemble/utils';
import { badGateway, badRequest, methodNotAllowed, notFound } from '@hapi/boom';
import axios from 'axios';
import { Context, Middleware } from 'koa';
import { get, pick } from 'lodash-es';
import { Op } from 'sequelize';

import { App, EmailAuthorization } from '../models/index.js';
import pkg from '../package.json' assert { type: 'json' };
import { email } from '../utils/actions/email.js';
import { getRemapperContext } from '../utils/app.js';

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

async function handleEmail(ctx: Context, app: App, action: EmailActionDefinition): Promise<void> {
  const {
    mailer,
    method,
    request: { body: data },
    user,
  } = ctx;
  if (method !== 'POST') {
    throw methodNotAllowed('Method must be POST for email actions');
  }

  await user?.reload({
    attributes: ['primaryEmail', 'name', 'timezone'],
    include: [
      {
        required: false,
        model: EmailAuthorization,
        attributes: ['verified'],
        where: {
          email: { [Op.col]: 'User.primaryEmail' },
        },
      },
    ],
  });

  await email({ action, app, data, mailer, user });
  ctx.status = 204;
}

async function handleRequestProxy(
  ctx: Context,
  app: App,
  action: RequestLikeActionDefinition,
  useBody: boolean,
): Promise<void> {
  const {
    method,
    query,
    request: { body },
    user,
  } = ctx;

  let data;
  if (useBody) {
    data = body;
  } else {
    try {
      data = JSON.parse(query.data as string);
    } catch {
      throw badRequest('data should be a JSON object');
    }
  }

  await user?.reload({
    attributes: ['primaryEmail', 'name', 'timezone'],
    include: [
      {
        required: false,
        model: EmailAuthorization,
        attributes: ['verified'],
        where: {
          email: { [Op.col]: 'User.primaryEmail' },
        },
      },
    ],
  });

  const context = await getRemapperContext(
    app,
    app.definition.defaultLanguage || defaultLocale,
    user && {
      sub: user.id,
      name: user.name,
      email: user.primaryEmail,
      email_verified: Boolean(user.EmailAuthorizations?.[0]?.verified),
      zoneinfo: user.timezone,
    },
  );
  const axiosConfig = formatRequestAction(
    action,
    data,
    (remapper, d) => remap(remapper, d, context),
    context.context,
  );

  if (axiosConfig.method.toUpperCase() !== method) {
    throw badRequest('Method does match the request action method');
  }

  if (useBody) {
    axiosConfig.data = data;
  }
  (axiosConfig.headers as Record<string, string>)['user-agent'] = `AppsembleServer/${pkg.version}`;
  axiosConfig.responseType = 'stream';
  axiosConfig.validateStatus = () => true;

  let response;
  logger.verbose(`Forwarding request to ${axios.getUri(axiosConfig)}`);
  try {
    response = await axios(axiosConfig);
  } catch (err: unknown) {
    logger.error(err);
    throw badGateway();
  }

  ctx.status = response.status;
  ctx.set(pick(response.headers, allowResponseHeaders));
  ctx.body = response.data;
}

function createProxyHandler(useBody: boolean): Middleware {
  return async (ctx) => {
    const {
      pathParams: { appId, path },
    } = ctx;

    const app = await App.findByPk(appId, {
      attributes: [
        'definition',
        'domain',
        'emailName',
        'emailHost',
        'emailUser',
        'emailPassword',
        'emailPort',
        'emailSecure',
        'id',
        'OrganizationId',
        'path',
      ],
    });

    if (!app) {
      throw notFound('App not found');
    }

    const appAction = get(app.definition, path) as ActionDefinition;
    const action = supportedActions.find((act) => act === appAction?.type);

    switch (action) {
      case 'email':
        return handleEmail(ctx, app, appAction as EmailActionDefinition);
      case 'request':
        return handleRequestProxy(ctx, app, appAction as RequestLikeActionDefinition, useBody);
      default:
        throw badRequest('path does not point to a proxyable action');
    }
  };
}

export const proxyDelete = createProxyHandler(false);
export const proxyGet = createProxyHandler(false);
export const proxyPatch = createProxyHandler(true);
export const proxyPost = createProxyHandler(true);
export const proxyPut = createProxyHandler(true);
