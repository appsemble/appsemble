import { assertKoaError, serveIcon } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, AppMember } from '../../../../models/index.js';

export async function getAppMemberPicture(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, appMemberId },
  } = ctx;

  const app = await App.findByPk(appId);

  assertKoaError(!app, ctx, 404, 'App could not be found.');

  const appMember = await AppMember.findByPk(appMemberId);

  assertKoaError(!appMember, ctx, 404, 'This member does not exist.');

  assertKoaError(!appMember.picture, ctx, 404, 'This member has no profile picture set.');

  await serveIcon(ctx, {
    icon: appMember.picture,
    fallback: 'user-solid.png',
    raw: true,
  });
}
