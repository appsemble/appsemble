import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, AppOAuth2Secret } from '../../../../../models/index.js';

export async function getAppOAuth2Secret(ctx: Context): Promise<void> {
  const { appId, appOAuth2SecretId } = ctx.pathParams;

  const app = await App.findByPk(appId, { attributes: ['id'] });

  assertKoaCondition(!!app, ctx, 404, 'App not found');

  const appOAuth2Secret = await AppOAuth2Secret.findOne({
    attributes: {
      exclude: [
        'clientSecret',
        'created',
        'icon',
        'id',
        'name',
        'remapper',
        'tokenUrl',
        'updated',
        'userInfoUrl',
        'AppId',
      ],
    },
    where: {
      AppId: appId,
      id: appOAuth2SecretId,
    },
  });

  assertKoaCondition(!!appOAuth2Secret, ctx, 404, 'OAuth2 secret not found');

  ctx.body = appOAuth2Secret;
}
