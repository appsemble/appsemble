import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { Op } from 'sequelize';

import { App, getAppDB } from '../../../../models/index.js';

export async function deleteSeedAppMembers(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId);
  assertKoaCondition(app != null, ctx, 404, 'App not found');
  const { AppMember } = await getAppDB(appId);
  assertKoaCondition(app.demoMode, ctx, 403, 'App should be in demo mode');

  await AppMember.destroy({
    where: {
      [Op.or]: {
        seed: true,
        ephemeral: true,
      },
    },
  });
}
