import { logger } from '@appsemble/node-utils';
import { getRemapperContext } from '@appsemble/node-utils/app.js';
import { ActionDefinition, App, RequestLikeActionDefinition } from '@appsemble/types';
import { defaultLocale, formatRequestAction, remap } from '@appsemble/utils';
import { badGateway, badRequest, notFound } from '@hapi/boom';
import axios from 'axios';
import { Context, Middleware } from 'koa';
import { get, pick } from 'lodash-es';

import pkg from '../../package.json' assert { type: 'json' };
import { getAppUrl } from '../routes/appRouter/options/getAppUrl.js';

/**
 * These response headers are forwarded when proxying requests.
 */
const allowResponseHeaders = [
  'content-encoding',
  'content-length',
  'content-type',
  'transfer-encoding',
];

const supportedActions = ['email', 'notify', 'request'];

async function handleRequestProxy(
  ctx: Context,
  app: App,
  action: RequestLikeActionDefinition,
  useBody: boolean,
): Promise<void> {
  const {
    appMessages,
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

  // Await user?.reload({
  //   attributes: ['primaryEmail', 'name', 'timezone'],
  //   include: [
  //     {
  //       required: false,
  //       model: EmailAuthorization,
  //       attributes: ['verified'],
  //       where: {
  //         email: { [Op.col]: 'User.primaryEmail' },
  //       },
  //     },
  //   ],
  // });

  const appUrl = String(await getAppUrl({ context: ctx, app }));

  const language = app.definition.defaultLanguage || defaultLocale;

  const context = getRemapperContext(
    app,
    appUrl,
    appMessages,
    language,
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
  return (ctx) => {
    const {
      appsembleApp,
      pathParams: { path },
    } = ctx;

    const app = appsembleApp;

    if (!app) {
      throw notFound('App not found');
    }

    const appAction = get(app.definition, path) as ActionDefinition;
    const action = supportedActions.find((act) => act === appAction?.type);

    switch (action) {
      // Case 'email':
      //   return handleEmail(ctx, app, appAction as EmailActionDefinition);
      // case 'notify':
      //   return handleNotify(ctx, app, appAction as NotifyActionDefinition);
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
