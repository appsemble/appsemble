import { assertKoaCondition, serveIcon } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../../models/index.js';

export async function getAppMemberPicture(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, appMemberId },
  } = ctx;
  const app = await App.findByPk(appId);
  assertKoaCondition(app != null, ctx, 404, 'App not found.');

  const { AppMember } = await getAppDB(appId);
  const appMember = await AppMember.findByPk(appMemberId, { attributes: ['picture'] });
  assertKoaCondition(appMember != null, ctx, 404, 'App member not found.');

  assertKoaCondition(
    appMember.picture != null,
    ctx,
    404,
    'This member has no profile picture set.',
  );

  await serveIcon(ctx, {
    icon: appMember.picture,
    fallback: 'user-solid.png',
    raw: true,
  });
}
