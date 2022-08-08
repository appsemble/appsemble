import { logger } from '@appsemble/node-utils';
import { defaultLocale, remap, RemapperContext } from '@appsemble/utils';

import { actions, ServerActionParameters } from './actions';
import { argv } from './argv';

export async function handleAction(
  action: (params: ServerActionParameters) => Promise<unknown>,
  params: ServerActionParameters,
): Promise<void> {
  logger.info(`Running action: ${params.action.type}`);
  const url = new URL(argv.host);
  url.hostname =
    params.app.domain || `${params.app.path}.${params.app.OrganizationId}.${url.hostname}`;
  const appUrl = String(url);
  const context: RemapperContext = {
    appId: params.app.id,
    appUrl,
    url: String(url),
    context: {},
    // XXX: Implement getMessage and default language selections
    getMessage() {
      return null;
    },
    userInfo: undefined,
    locale: params.app.definition.defaultLanguage ?? defaultLocale,
  };
  let data =
    'remapBefore' in params.action
      ? remap(params.action.remapBefore, params.data, context)
      : params.data;

  try {
    data = await action({ ...params, data });
    if ('remapAfter' in params.action) {
      data = remap(params.action.remapAfter, data, context);
    }
    if (params.action.onSuccess) {
      await handleAction(actions[params.action.onSuccess.type], {
        ...params,
        action: params.action.onSuccess,
        data,
      });
    }
  } catch (error) {
    logger.error(`Error running action: ${params.action.type}`);
    if (params.action.onError) {
      return handleAction(actions[params.action.onError.type], {
        ...params,
        action: params.action.onError,
        data,
      });
    }
    throw error;
  }
  logger.info(`Successfully ran action: ${params.action.type}`);
}
