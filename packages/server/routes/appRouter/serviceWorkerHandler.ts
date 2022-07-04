import { promises as fs } from 'fs';
import { resolve } from 'path';

import { getAppBlocks, parseBlockName, prefixBlockURL } from '@appsemble/utils';
import { Context } from 'koa';
import { Op } from 'sequelize';

import { BlockAsset, BlockVersion } from '../../models';
import { getApp } from '../../utils/app';

/**
 * A handler used to serve the service worker output from Webpack from the client root.
 *
 * @param ctx - The Koa context.
 */
export async function serviceWorkerHandler(ctx: Context): Promise<void> {
  const production = process.env.NODE_ENV === 'production';
  const filename = production ? '/service-worker.js' : '/app/service-worker.js';
  const serviceWorker = await (production
    ? fs.readFile(
        resolve(__dirname, '..', '..', '..', '..', 'dist', 'app', 'service-worker.js'),
        'utf8',
      )
    : ctx.fs.promises.readFile(filename, 'utf8'));
  const { app } = await getApp(ctx, {
    attributes: ['definition'],
  });
  ctx.assert(app, 404, 'App does not exist.');

  const blocks = getAppBlocks(app.definition);
  const blockManifests = await BlockVersion.findAll({
    attributes: ['name', 'OrganizationId', 'version', 'layout', 'actions', 'events'],
    include: [
      {
        attributes: ['filename'],
        model: BlockAsset,
        where: {
          BlockVersionId: { [Op.col]: 'BlockVersion.id' },
        },
      },
    ],
    where: {
      [Op.or]: blocks.map(({ type, version }) => {
        const [OrganizationId, name] = parseBlockName(type);
        return { name, OrganizationId, version };
      }),
    },
  });

  ctx.body = `const blockAssets=${JSON.stringify(
    blockManifests.flatMap((block) =>
      block.BlockAssets.filter((asset) => !asset.filename.endsWith('.map')).map((asset) =>
        prefixBlockURL(
          { type: `@${block.OrganizationId}/${block.name}`, version: block.version },
          asset.filename,
        ),
      ),
    ),
  )};${serviceWorker}`;
  ctx.type = 'application/javascript';
}
