import { getRemapperContext, logger, type Options } from '@appsemble/node-utils';
import {
  type ActionDefinition,
  type App,
  type EmailActionDefinition,
  type NotifyActionDefinition,
  type RequestLikeActionDefinition,
} from '@appsemble/types';
import { defaultLocale, formatRequestAction, remap } from '@appsemble/utils';
import { badGateway, badRequest, methodNotAllowed, notFound } from '@hapi/boom';
import axios from 'axios';
import { type Context, type Middleware } from 'koa';
import { get, pick } from 'lodash-es';

import pkg from '../../package.json' assert { type: 'json' };

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

async function handleEmail(
  ctx: Context,
  app: App,
  action: EmailActionDefinition,
  options: Options,
): Promise<void> {
  const {
    mailer,
    method,
    request: { body: data },
    user,
  } = ctx;
  if (method !== 'POST') {
    throw methodNotAllowed('Method must be POST for email actions');
  }

  const { email, reloadUser } = options;
  await reloadUser({ context: ctx });

  await email({ action, data, mailer, user, options, context: ctx });
  ctx.status = 204;
}

async function handleNotify(
  ctx: Context,
  app: App,
  action: NotifyActionDefinition,
  options: Options,
): Promise<void> {
  const {
    request: { body: data },
    user,
  } = ctx;

  const { reloadUser, sendNotifications } = options;
  await reloadUser({ context: ctx });

  const remapperContext = await getRemapperContext(
    app,
    app.definition.defaultLanguage || defaultLocale,
    user && {
      sub: user.id,
      name: user.name,
      email: user.primaryEmail,
      email_verified: Boolean(user.EmailAuthorizations?.[0]?.verified),
      zoneinfo: user.timezone,
    },
    options,
    ctx,
  );

  const to = remap(action.to, data, remapperContext) as string;
  const title = remap(action.title, data, remapperContext) as string;
  const body = remap(action.body, data, remapperContext) as string;

  await sendNotifications({ app, to, title, body });

  ctx.status = 204;
}

async function handleRequestProxy(
  ctx: Context,
  app: App,
  action: RequestLikeActionDefinition,
  useBody: boolean,
  options: Options,
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

  const { reloadUser } = options;
  await reloadUser({ context: ctx });

  const remapperContext = await getRemapperContext(
    app,
    app.definition.defaultLanguage || defaultLocale,
    user && {
      sub: user.id,
      name: user.name,
      email: user.primaryEmail,
      email_verified: Boolean(user.EmailAuthorizations?.[0]?.verified),
      zoneinfo: user.timezone,
    },
    options,
    ctx,
  );

  const axiosConfig = formatRequestAction(
    action,
    data,
    (remapper, d) => remap(remapper, d, remapperContext),
    remapperContext.context,
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

function createProxyHandler(useBody: boolean, options: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { path },
    } = ctx;

    const app = await options.getApp({ context: ctx });

    if (!app) {
      throw notFound('App not found');
    }

    const appAction = get(app.definition, path) as ActionDefinition;
    const action = supportedActions.find((act) => act === appAction?.type);

    switch (action) {
      case 'email':
        return handleEmail(ctx, app, appAction as EmailActionDefinition, options);
      case 'notify':
        return handleNotify(ctx, app, appAction as NotifyActionDefinition, options);
      case 'request':
        return handleRequestProxy(
          ctx,
          app,
          appAction as RequestLikeActionDefinition,
          useBody,
          options,
        );
      default:
        throw badRequest('path does not point to a proxyable action');
    }
  };
}

export function createProxyDelete(options: Options): Middleware {
  return createProxyHandler(false, options);
}

export function createProxyGet(options: Options): Middleware {
  return createProxyHandler(false, options);
}

export function createProxyPatch(options: Options): Middleware {
  return createProxyHandler(true, options);
}

export function createProxyPost(options: Options): Middleware {
  return createProxyHandler(true, options);
}

export function createProxyPut(options: Options): Middleware {
  return createProxyHandler(true, options);
}
