import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, AppOAuth2Secret } from '../../../../../models/index.js';

export async function getAppOAuth2Secret(ctx: Context): Promise<void> {
  const { appId, appOAuth2SecretId } = ctx.pathParams;

  const app = await App.findByPk(appId, {
    attributes: [],
    include: [
      {
        attributes: ['authorizationUrl', 'clientId', 'scope'],
        model: AppOAuth2Secret,
        where: { id: appOAuth2SecretId },
      },
    ],
  });

  assertKoaError(!app, ctx, 404, 'App not found');
  assertKoaError(!app.AppOAuth2Secrets?.length, ctx, 404, 'OAuth2 secret not found');

  [ctx.body] = app.AppOAuth2Secrets;
}
