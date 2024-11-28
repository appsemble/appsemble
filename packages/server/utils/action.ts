import { logger } from '@appsemble/node-utils';
import { defaultLocale, has, remap, type RemapperContext } from '@appsemble/utils';
import { IntlMessageFormat } from 'intl-messageformat';

import { actions, type ServerActionParameters } from './actions/index.js';
import { argv } from './argv.js';
import { AppMember, AppMessages } from '../models/index.js';

export async function handleAction(
  action: (params: ServerActionParameters) => Promise<unknown>,
  params: ServerActionParameters,
): Promise<unknown> {
  logger.info(`Running action: ${params.action.type}`);
  const url = new URL(argv.host);
  url.hostname =
    params.app.domain || `${params.app.path}.${params.app.OrganizationId}.${url.hostname}`;
  const appUrl = String(url);
  const locale = params.app.definition.defaultLanguage ?? defaultLocale;
  const messages = await AppMessages.findOne({
    attributes: ['messages'],
    where: { AppId: params.app.id, language: locale },
  });

  const context: RemapperContext = params.internalContext ?? {
    appId: params.app.id,
    appUrl,
    url: String(url),
    context: {},
    history: [],
    getMessage({ defaultMessage, id }) {
      const messageIds = messages?.messages?.messageIds;
      const message = has(messageIds, id) ? messageIds[id] : defaultMessage;
      return new IntlMessageFormat(message);
    },
    getVariable() {
      return null;
    },
    appMemberInfo: undefined,
    locale,
  };
  let data =
    'remapBefore' in params.action
      ? remap(params.action.remapBefore, params.data, context)
      : params.data;

  const updatedContext = {
    ...context,
    history: [...(context?.history ?? []), data],
  };

  try {
    const appMemberInfo = await AppMember.findOne({
      where: { AppId: params.app.id, role: 'cron' },
    });
    data = await action({
      ...params,
      context: params.app?.definition?.security?.cron
        ? { ...params.context, user: appMemberInfo, client: { app: params.app.toJSON() } }
        : { ...params.context },
      data,
      internalContext: updatedContext,
    });
    if ('remapAfter' in params.action) {
      data = remap(params.action.remapAfter, data, updatedContext);
    }
    if (params.action.onSuccess) {
      return await handleAction(actions[params.action.onSuccess.type], {
        ...params,
        action: params.action.onSuccess,
        data,
        internalContext: updatedContext,
      });
    }
  } catch (error) {
    logger.error(`Error running action: ${params.action.type}`);
    if (params.action.onError) {
      return handleAction(actions[params.action.onError.type], {
        ...params,
        action: params.action.onError,
        data,
        internalContext: updatedContext,
      });
    }
    throw error;
  }
  logger.info(`Successfully ran action: ${params.action.type}`);
  return data;
}
