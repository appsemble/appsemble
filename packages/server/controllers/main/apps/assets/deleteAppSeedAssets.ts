import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { Op } from 'sequelize';

import { App, Asset } from '../../../../models/index.js';

export async function deleteAppSeedAssets(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, { attributes: ['id', 'demoMode'] });

  assertKoaError(!app, ctx, 404, 'App not found');

  const seededAssets = await Asset.findAll({
    attributes: ['id'],
    where: {
      AppId: app.id,
      [Op.or]: [{ seed: true }, { ephemeral: true }],
    },
  });

  for (const seededAsset of seededAssets) {
    await seededAsset.destroy();
  }

  ctx.status = 204;
}
