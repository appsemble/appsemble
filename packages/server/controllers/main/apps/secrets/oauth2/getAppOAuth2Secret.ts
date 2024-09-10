import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, AppOAuth2Secret } from '../../../../../models/index.js';

export async function getAppOAuth2Secret(ctx: Context): Promise<void> {
  const { appId, appOAuth2SecretId } = ctx.pathParams;

  const app = await App.findByPk(appId, { attributes: [] });

  assertKoaError(!app, ctx, 404, 'App not found');

  const appOAuth2Secret = await AppOAuth2Secret.findOne({
    where: {
      AppId: appId,
      id: appOAuth2SecretId,
    },
  });

  assertKoaError(!appOAuth2Secret, ctx, 404, 'OAuth2 secret not found');

  ctx.body = appOAuth2Secret;
}
