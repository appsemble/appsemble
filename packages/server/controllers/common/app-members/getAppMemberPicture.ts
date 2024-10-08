import { assertKoaError, serveIcon } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { AppMember } from '../../../models/index.js';

export async function getAppMemberPicture(ctx: Context): Promise<void> {
  const {
    pathParams: { appMemberId },
  } = ctx;

  const appMember = await AppMember.findByPk(appMemberId, { attributes: ['picture'] });

  assertKoaError(!appMember, ctx, 404, 'App member not found.');

  assertKoaError(!appMember.picture, ctx, 404, 'This member has no profile picture set.');

  await serveIcon(ctx, {
    icon: appMember.picture,
    fallback: 'user-solid.png',
    raw: true,
  });
}
