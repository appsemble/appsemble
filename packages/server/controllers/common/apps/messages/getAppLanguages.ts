import { assertKoaCondition, getMessagesUtil } from '@appsemble/node-utils';
import { compareStrings, defaultLocale } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppMessages } from '../../../../models/index.js';
import { options } from '../../../../options/options.js';

export async function getAppLanguages(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    query: { override },
    queryParams: { includeMessages },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['definition'],
    include: [{ model: AppMessages, required: false }],
  });

  assertKoaCondition(!!app, ctx, 404, 'App not found');
  if (includeMessages) {
    const result = [];
    for (const message of app.AppMessages) {
      result.push(await getMessagesUtil(ctx, message.language, appId, '', options, override));
    }
    ctx.body = result;
    return;
  }

  ctx.body = [
    ...new Set([
      ...app.AppMessages.map((message) => message.language),
      app.definition.defaultLanguage || defaultLocale,
    ]),
  ].sort(compareStrings);
}
