import {
  assertKoaCondition,
  createFormData,
  EmailQuotaExceededError,
  getContainerNamespace,
  getRemapperContext,
  logger,
  type Options,
  parseServiceUrl,
  scaleDeployment,
  setLastRequestAnnotation,
  throwKoaError,
  version,
  waitForPodReadiness,
} from '@appsemble/node-utils';
import {
  type ActionDefinition,
  type App,
  type EmailActionDefinition,
  type NotifyActionDefinition,
  type RequestLikeActionDefinition,
} from '@appsemble/types';
import { defaultLocale, remap } from '@appsemble/utils';
import axios, { type RawAxiosRequestConfig } from 'axios';
import { type Context, type Middleware } from 'koa';
import { get, mapValues, pick } from 'lodash-es';
import { type JsonObject, type JsonValue } from 'type-fest';

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

export async function handleEmail(
  ctx: Context,
  app: App,
  action: EmailActionDefinition,
  options: Options,
): Promise<void> {
  const {
    mailer,
    method,
    request: { body: data },
  } = ctx;
  if (method !== 'POST') {
    throwKoaError(ctx, 405, 'Method must be POST for email actions');
  }

  const { email } = options;

  try {
    await email({ action, data, mailer, options, context: ctx });
  } catch (error: unknown) {
    if (error instanceof EmailQuotaExceededError) {
      throwKoaError(ctx, 429, error.message);
    }
    ctx.throw(error as any);
  }
  ctx.status = 204;
}

export async function handleNotify(
  ctx: Context,
  app: App,
  action: NotifyActionDefinition,
  options: Options,
): Promise<void> {
  const {
    request: { body: data },
  } = ctx;

  const { sendNotifications } = options;

  const remapperContext = await getRemapperContext(
    app,
    app.definition.defaultLanguage || defaultLocale,
    options,
    ctx,
  );

  const to = remap(action.to, data, remapperContext) as string;
  const title = remap(action.title, data, remapperContext) as string;
  const body = remap(action.body, data, remapperContext) as string;

  await sendNotifications({ app, to, title, body });

  ctx.status = 204;
}

function deserializeResource(data: any): any {
  // Extract the resource and assets from the JSON object
  const { resource } = data;
  const assets = data.assets as Blob[];

  // Function to replace asset placeholders with actual Blobs
  const replaceAssets = (value: JsonValue): any => {
    if (Array.isArray(value)) {
      return value.map(replaceAssets);
    }
    if (typeof value === 'string' && /^\d+$/.test(value)) {
      return assets[Number(value)];
    }
    if (value && typeof value === 'object') {
      return mapValues(value as JsonObject, replaceAssets);
    }
    return value;
  };

  // Replace placeholders and return the deserialized resource
  return replaceAssets(resource);
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
    request: { body, headers },
  } = ctx;

  let data;
  if (useBody) {
    if (Object.hasOwn(body, 'assets')) {
      const deserializedBody = deserializeResource(body);
      data = createFormData(deserializedBody.length === 1 ? deserializedBody[0] : deserializedBody);
    } else {
      data = body;
    }
  } else {
    try {
      data = JSON.parse(query.data as string);
    } catch {
      throwKoaError(ctx, 400, 'data should be a JSON object.');
    }
  }

  // TODO
  const { applyAppServiceSecrets } = options;

  const remapperContext = await getRemapperContext(
    app,
    app.definition.defaultLanguage || defaultLocale,
    options,
    ctx,
  );

  const proxyUrl = new URL(String(remap(action.url, data, remapperContext)));
  if (/\/api\/apps\/\d+\/actions\/.*/.test(proxyUrl.pathname) && ctx.URL.host === proxyUrl.host) {
    throwKoaError(
      ctx,
      400,
      'Not allowed to make direct requests to the Appsemble action controller using this action.',
    );
  }

  let params;
  try {
    if (query.params) {
      params = JSON.parse(query.params as string);
    }
  } catch {
    throwKoaError(ctx, 400, 'params should be a JSON object.');
  }

  let axiosConfig: RawAxiosRequestConfig = {
    method: action.method ?? 'GET',
    url: String(proxyUrl),
    params,
    responseType: 'arraybuffer',
    headers: {},
  };

  axiosConfig = await applyAppServiceSecrets({ axiosConfig, context: ctx, app });
  axiosConfig.headers ??= {};

  if (axiosConfig.method?.toUpperCase() !== method) {
    throwKoaError(ctx, 400, 'Method does not match the request action method');
  }

  if (useBody) {
    axiosConfig.data = data;

    if (headers['content-type']) {
      axiosConfig.headers['Content-Type'] = headers['content-type'];
    }
  }

  axiosConfig.headers['user-agent'] = `AppsembleServer/${version}`;
  axiosConfig.headers.connection = 'close';
  axiosConfig.responseType = 'stream';
  axiosConfig.validateStatus = () => true;
  axiosConfig.decompress = false;

  let response;
  const containerUrlPattern = /^http:\/\/(([\da-z-]+).){2}svc.cluster.local/;

  // Restricting access to only the containers defined by the app
  if (containerUrlPattern.test(String(proxyUrl))) {
    axiosConfig.url = axiosConfig.url?.replace(
      axiosConfig.url.split('.')[1],
      getContainerNamespace(),
    );

    const { appId } = parseServiceUrl(String(proxyUrl));
    if (appId !== String(app.id)) {
      throwKoaError(ctx, 403, 'Forbidden');
    }
  }

  logger.verbose(`Forwarding request to ${axios.getUri(axiosConfig)}`);
  logger.verbose('Axios Config:');
  logger.verbose(axiosConfig);
  try {
    response = await axios(axiosConfig);
    logger.verbose(response);
  } catch (err: unknown) {
    // If request is sent to a companion container and fails
    // Try to start it anew and retry the request
    if (containerUrlPattern.test(String(proxyUrl))) {
      const { deploymentName, namespace } = parseServiceUrl(String(proxyUrl));
      try {
        await scaleDeployment(namespace, deploymentName, 1);
        await waitForPodReadiness(
          namespace,
          deploymentName,
          Number.isNaN(Number(process.env.POD_READINESS_TIMEOUT))
            ? undefined
            : Number(process.env.POD_READINESS_TIMEOUT),
        );

        response = await axios(axiosConfig);
      } catch {
        throwKoaError(ctx, 502, 'Bad Gateway');
      } finally {
        await setLastRequestAnnotation(namespace, deploymentName);
      }
    } else {
      logger.error(err);
      logger.verbose('Response:');
      logger.verbose(response);

      throwKoaError(ctx, 502, 'Bad Gateway');
    }
  }

  ctx.status = response.status;
  ctx.set(pick(response.headers, allowResponseHeaders));
  ctx.body = response.data;
}

export function createProxyHandler(useBody: boolean, options: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId, path },
    } = ctx;

    const app = await options.getApp({ context: ctx, query: { where: { id: appId } } });
    assertKoaCondition(app != null, ctx, 404, 'App not found');
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
        throwKoaError(ctx, 400, 'path does not point to a proxyable action');
    }
  };
}
