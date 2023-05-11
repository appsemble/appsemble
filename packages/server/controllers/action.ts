import https from 'node:https';

import { basicAuth, logger } from '@appsemble/node-utils';
import {
  type ActionDefinition,
  type EmailActionDefinition,
  type NotifyActionDefinition,
  type RequestLikeActionDefinition,
} from '@appsemble/types';
import { checkAppRole, defaultLocale, formatRequestAction, remap } from '@appsemble/utils';
import { badGateway, badRequest, methodNotAllowed, notFound } from '@hapi/boom';
import axios from 'axios';
import { type Context, type Middleware } from 'koa';
import { get, pick } from 'lodash-es';
import { isMatch } from 'matcher';
import { Op } from 'sequelize';

import {
  App,
  AppMember,
  AppServiceSecret,
  AppSubscription,
  EmailAuthorization,
  Organization,
} from '../models/index.js';
import pkg from '../package.json' assert { type: 'json' };
import { email } from '../utils/actions/email.js';
import { getRemapperContext } from '../utils/app.js';
import { argv } from '../utils/argv.js';
import { decrypt, encrypt } from '../utils/crypto.js';
import { sendNotification } from '../utils/sendNotification.js';

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

/**
 * Verifies whether or not the user has sufficient permissions to authenticate outgoing request.
 * Will return an empty array if the user does not satisfy the requirements.
 *
 * @param ctx Koa context of the request
 * @param app App as fetched from the database.
 * @returns AppServiceSecrets to potentially apply to the outgoing request
 */
async function verifyPermission(ctx: Context, app: App): Promise<AppServiceSecret[]> {
  if (!app.definition.security) {
    return [];
  }

  if (!app.definition?.roles?.length) {
    return [];
  }

  const appServiceSecrets = await AppServiceSecret.findAll({
    where: { AppId: app.id },
  });

  if (!appServiceSecrets.length) {
    return [];
  }

  const { user } = ctx;

  if (!user) {
    return [];
  }

  await app.reload({
    attributes: ['id', 'OrganizationId', 'definition'],
    include: user
      ? [
          { model: Organization, attributes: ['id'] },
          {
            model: AppMember,
            attributes: ['role', 'UserId'],
            required: false,
            where: { UserId: user.id },
          },
        ]
      : [],
  });

  const member = app.AppMembers?.find((m) => m.UserId === user?.id);
  const { policy = 'everyone', role: defaultRole } = app.definition.security.default;
  let role: string;

  if (member) {
    ({ role } = member);
  } else {
    switch (policy) {
      case 'everyone':
        role = defaultRole;
        break;

      case 'organization':
        if (!(await app.Organization.$has('User', user.id))) {
          return [];
        }

        role = defaultRole;
        break;

      case 'invite':
        return [];

      default:
        role = null;
    }
  }

  const { roles: appRoles } = app.definition;
  if (!appRoles.some((r) => checkAppRole(app.definition.security, r, role, null))) {
    return [];
  }

  return appServiceSecrets.map<AppServiceSecret>((secret) => secret.toJSON());
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

  const appServiceSecrets = await verifyPermission(ctx, app);

  for (const serviceSecret of appServiceSecrets) {
    if (!isMatch(axiosConfig.url, serviceSecret.urlPatterns.split(','))) {
      continue;
    }

    const decryptedSecret = decrypt(serviceSecret.secret, argv.aesSecret);

    switch (serviceSecret.authenticationMethod) {
      case 'http-basic':
        if (axiosConfig.headers?.Authorization) {
          continue;
        }
        axiosConfig.headers.Authorization = basicAuth(serviceSecret.identifier, decryptedSecret);
        break;
      case 'client-certificate':
        if (axiosConfig.httpsAgent) {
          continue;
        }
        axiosConfig.httpsAgent = new https.Agent({
          cert: serviceSecret.identifier,
          key: decryptedSecret,
        });
        break;
      case 'client-credentials':
        if (axiosConfig.headers?.Authorization) {
          continue;
        }
        if (
          !serviceSecret.accessToken ||
          // Only retrieve a new token starting 10 minutes before expiry of the current token
          Number(serviceSecret.expiresAt) - 6 * 1e5 < Date.now()
        ) {
          const clientCertSecret = appServiceSecrets.find(
            (secret) =>
              secret.authenticationMethod === 'client-certificate' &&
              isMatch(serviceSecret.tokenUrl, secret.urlPatterns.split(',')),
          );
          let httpsAgent;
          if (clientCertSecret) {
            httpsAgent = new https.Agent({
              cert: clientCertSecret.identifier,
              key: decrypt(clientCertSecret.secret, argv.aesSecret),
            });
          }
          const response = await axios({
            url: serviceSecret.tokenUrl,
            method: 'POST',
            data: {
              grant_type: 'client_credentials',
            },
            headers: {
              'user-agent': `AppsembleServer/${pkg.version}`,
              'content-type': 'application/x-www-form-urlencoded',
              authorization: basicAuth(serviceSecret.identifier, decryptedSecret),
            },
            httpsAgent,
          });
          const updatedSecret = (
            await AppServiceSecret.update(
              {
                accessToken: encrypt(response.data.access_token, argv.aesSecret),
                expiresAt: Date.now() + response.data.expires_in * 1e3,
              },
              { where: { id: serviceSecret.id }, returning: true },
            )
          )[1][0];
          axiosConfig.headers.Authorization = `Bearer ${decrypt(
            updatedSecret.accessToken,
            argv.aesSecret,
          )}`;
        } else {
          axiosConfig.headers.Authorization = `Bearer ${decrypt(
            serviceSecret.accessToken,
            argv.aesSecret,
          )}`;
        }
        break;
      case 'cookie': {
        const cookie = `${encodeURIComponent(serviceSecret.identifier)}=${encodeURIComponent(
          decryptedSecret,
        )};`;
        if (axiosConfig.headers['Set-Cookie']) {
          axiosConfig.headers['Set-Cookie'] += ` ${cookie}`;
        } else {
          axiosConfig.headers['Set-Cookie'] = cookie;
        }
        break;
      }
      case 'custom-header':
        if (
          serviceSecret.identifier.toLowerCase() === 'authorization' &&
          axiosConfig.headers?.Authorization
        ) {
          continue;
        }
        axiosConfig.headers[serviceSecret.identifier] = decryptedSecret;
        break;
      case 'query-parameter':
        axiosConfig.params = {
          ...axiosConfig.params,
          [serviceSecret.identifier]: decryptedSecret,
        };
        break;
      default:
        break;
    }
  }

  if (axiosConfig.method.toUpperCase() !== method) {
    throw badRequest('Method does match the request action method');
  }

  if (useBody) {
    axiosConfig.data = data;
  }

  axiosConfig.headers['user-agent'] = `AppsembleServer/${pkg.version}`;
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
      case 'notify':
        return handleNotify(ctx, app, appAction as NotifyActionDefinition);
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
