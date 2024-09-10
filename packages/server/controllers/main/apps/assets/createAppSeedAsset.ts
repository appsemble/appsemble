import { assertKoaError, throwKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { UniqueConstraintError } from 'sequelize';

import { App, Asset } from '../../../../models/index.js';
import { getUserAppAccount } from '../../../../options/index.js';

export async function createAppSeedAsset(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: {
        clonable,
        file: { contents, filename, mime },
        name,
      },
    },
    user,
  } = ctx;

  const app = await App.findByPk(appId, { attributes: ['id', 'demoMode'] });
  const appMember = await getUserAppAccount(appId, user?.id);

  assertKoaError(!app, ctx, 404, 'App not found');

  let asset: Asset;
  try {
    asset = await Asset.create({
      AppId: appId,
      data: contents,
      filename,
      mime,
      name,
      AppMemberId: appMember?.id,
      seed: true,
      ephemeral: false,
      clonable,
    });

    if (app.demoMode) {
      asset = await Asset.create({
        AppId: appId,
        data: contents,
        filename,
        mime,
        name,
        AppMemberId: appMember?.id,
        seed: false,
        ephemeral: true,
        clonable: false,
      });
    }
  } catch (error: unknown) {
    if (error instanceof UniqueConstraintError) {
      throwKoaError(ctx, 409, `An asset named ${name} already exists`);
    }
    throw error;
  }

  ctx.status = 201;
  ctx.body = { id: asset.id, mime, filename, name };
}
