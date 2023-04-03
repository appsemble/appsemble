import { getAppUrl } from '@appsemble/cli/server/routes/appRouter/options/getAppUrl';
import {
  ActionDefinition,
  App,
  EmailActionDefinition,
  NotifyActionDefinition,
  RequestLikeActionDefinition,
} from '@appsemble/types';
import { defaultLocale, formatRequestAction, remap } from '@appsemble/utils';
import {badGateway, badRequest, methodNotAllowed, notFound} from '@hapi/boom';
import axios from 'axios';
import { Context, Middleware } from 'koa';
import { get, pick } from 'lodash-es';

import { getRemapperContext } from '../../app';
import { logger } from '../../logger';
import {AppSubscription, EmailAuthorization} from "@appsemble/server/models";
import {email} from "@appsemble/server/utils/actions/email";
import {sendNotification} from "@appsemble/server/utils/sendNotification";
import {ControllerOptions, Options} from "../types";

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

async function handleNotify(ctx: Context, app: App, action: NotifyActionDefinition): Promise<void> {
  const {
    request: { body: data },
    user,
  } = ctx;

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

  const to = remap(action.to, data, context) as string;

  await app?.reload({
    attributes: ['id', 'definition', 'vapidPrivateKey', 'vapidPublicKey'],
    include: [
      to === 'all'
        ? {
          model: AppSubscription,
          attributes: ['id', 'auth', 'p256dh', 'endpoint'],
        }
        : {
          model: AppSubscription,
          attributes: ['id', 'auth', 'p256dh', 'endpoint'],
          required: false,
          where: {
            UserId: to,
          },
        },
    ],
  });

  const title = remap(action.title, data, context) as string;
  const body = remap(action.body, data, context) as string;

  for (const subscription of app.AppSubscriptions) {
    sendNotification(app, subscription, { title, body });
  }

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

function createProxyHandler(useBody: boolean, { getApp }: Options): Middleware {
  return async (ctx) => {
    const {
      pathParams: { path },
    } = ctx;

    const app = await getApp({ context: ctx });

    if (!app) {
      throw notFound('App not found');
    }

    const appAction = get(app.definition, path) as ActionDefinition;
    const action = supportedActions.find((act) => act === appAction?.type);

    switch (action) {
      case 'email':
        return handleEmail(ctx, app, appAction as EmailActionDefinition);
      case 'notify':
        return handleNotify(ctx, app, appAction as NotifyActionDefinition);
      case 'request':
        return handleRequestProxy(ctx, app, appAction as RequestLikeActionDefinition, useBody);
      default:
        throw badRequest('path does not point to a proxyable action');
    }
  };
}

export function createProxyDelete(options: ControllerOptions): Middleware {
  return createProxyHandler(false, options);
}

export function createProxyGet(options: ControllerOptions): Middleware {
  return createProxyHandler(false, options);
}

export function createProxyPatch(options: ControllerOptions): Middleware {
  return createProxyHandler(true, options);
}

export function createProxyPost(options: ControllerOptions): Middleware {
  return createProxyHandler(true, options);
}

export function createProxyPut(options: ControllerOptions): Middleware {
  return createProxyHandler(true, options);
}
