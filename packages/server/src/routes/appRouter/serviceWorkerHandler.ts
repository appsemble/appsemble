import { promises as fs } from 'fs';
import { resolve } from 'path';

import { filterBlocks, getAppBlocks, prefixBlockURL } from '@appsemble/utils';
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
  const serviceWorker = production
    ? await fs.readFile(
        resolve(__dirname, '..', '..', '..', '..', '..', 'dist', 'app', 'service-worker.js'),
        'utf8',
      )
    : ctx.fs.promises.readFile(filename, 'utf-8');
  const { app } = await getApp(ctx, {
    attributes: ['definition'],
  });
  ctx.assert(app, 404, 'App does not exist.');
  const blocks = filterBlocks(Object.values(getAppBlocks(app.definition)));
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
        const [org, name] = type.split('/');
        return { name, OrganizationId: org.slice(1), version };
      }),
    },
  });
  ctx.body = `const blockAssets=${JSON.stringify(
    blockManifests.flatMap((block) =>
      block.BlockAssets.map((asset) =>
        prefixBlockURL({ type: block.name, version: block.version }, asset.filename),
      ),
    ),
  )};${serviceWorker}`;
  ctx.type = 'application/javascript';
}
