import { assertKoaError, serveIcon } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { Op } from 'sequelize';

import { App, AppMember } from '../../../../models/index.js';

export async function getAppMemberPicture(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, memberId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: [],
    include: [
      {
        model: AppMember,
        where: { [Op.or]: [{ id: memberId }, { UserId: memberId }] },
        required: false,
      },
    ],
  });

  assertKoaError(!app, ctx, 404, 'App could not be found.');
  assertKoaError(!app.AppMembers.length, ctx, 404, 'This member does not exist.');
  assertKoaError(!app.AppMembers[0].picture, ctx, 404, 'This member has no profile picture set.');

  await serveIcon(ctx, {
    icon: app.AppMembers[0].picture,
    fallback: 'user-solid.png',
    raw: true,
  });
}
