import { createReadStream, createWriteStream, existsSync } from 'node:fs';
import { unlink } from 'node:fs/promises';

import { assertKoaError, throwKoaError } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';
import { extension } from 'mime-types';
import { UniqueConstraintError } from 'sequelize';
import sharp from 'sharp';

import { App, Asset } from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';
import { uploadFile } from '../../../../utils/s3.js';

export async function createAppAsset(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: {
        clonable,
        file: { filename, mimeType, path },
        name,
      },
      query: { seed },
    },
  } = ctx;

  const app = await App.findByPk(appId, { attributes: ['id', 'demoMode', 'OrganizationId'] });

  assertKoaError(!app, ctx, 404, 'App not found');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.CreateAppAssets],
  });

  let asset: Asset;
  try {
    if (!(ctx.client && 'app' in ctx.client) && seed === 'true') {
      asset = await Asset.create({
        AppId: appId,
        data: Buffer.from('a'),
        filename,
        mime: mimeType,
        name,
        seed: true,
        ephemeral: false,
        clonable,
      });

      if (app.demoMode) {
        asset = await Asset.create({
          AppId: appId,
          data: Buffer.from('a'),
          filename,
          mime: mimeType,
          name,
          seed: false,
          ephemeral: true,
          clonable: false,
        });
      }
    } else {
      asset = await Asset.create({
        AppId: appId,
        data: Buffer.from('a'),
        filename,
        mime: mimeType,
        name,
        ephemeral: app.demoMode,
        clonable,
      });
    }
  } catch (error: unknown) {
    if (error instanceof UniqueConstraintError) {
      throwKoaError(ctx, 409, `An asset named ${name} already exists`);
    }
    throw error;
  }

  let uploadFrom = path;
  if (mimeType?.startsWith('image') && mimeType !== 'image/avif') {
    uploadFrom = `${path}_compressed`;
    const writeStream = createWriteStream(uploadFrom);
    sharp(path).rotate().toFormat('avif').pipe(writeStream);
  }

  await uploadFile(
    `app-${appId}`,
    `${asset.id}.${extension(mimeType)}`,
    createReadStream(uploadFrom),
  );

  await unlink(path);

  if (existsSync(uploadFrom)) {
    await unlink(uploadFrom);
  }

  ctx.status = 201;
  ctx.body = { id: asset.id, mime: mimeType, filename, name };
}
