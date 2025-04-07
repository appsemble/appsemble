import { defaultLocale, has, remap, type RemapperContext } from '@appsemble/lang-sdk';
import { logger } from '@appsemble/node-utils';
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

  const context: RemapperContext =
    params.internalContext ??
    // @ts-expect-error 2353 Messed up
    ({
      appId: params.app.id,
      appUrl,
      url: String(url),
      context: {},
      history: [],
      getMessage({ defaultMessage, id }) {
        const messageIds = messages?.messages?.messageIds;
        const message = id && messageIds && has(messageIds, id) ? messageIds[id] : defaultMessage;
        // @ts-expect-error 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks)
        return new IntlMessageFormat(message);
      },
      getVariable() {
        return null;
      },
      appMemberInfo: undefined,
      locale,
    } as RemapperContext);
  let data =
    'remapBefore' in params.action
      ? remap(params.action.remapBefore ?? null, params.data, context)
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
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      context: params.app?.definition?.security?.cron
        ? { ...params.context, user: appMemberInfo, client: { app: params.app.toJSON() } }
        : params.context,
      data,
      internalContext: updatedContext,
    });
    if ('remapAfter' in params.action) {
      data = remap(params.action.remapAfter ?? null, data, updatedContext);
    }
    if (params.action.onSuccess) {
      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks)
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
      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks)
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
