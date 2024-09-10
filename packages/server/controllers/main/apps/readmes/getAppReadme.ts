import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, AppReadme } from '../../../../models/index.js';

export async function getAppReadme(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, readmeId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: [],
    include: [
      {
        attributes: ['file'],
        model: AppReadme,
        required: false,
        where: { id: readmeId },
      },
    ],
  });

  assertKoaError(!app, ctx, 404, 'App not found');
  assertKoaError(!app.AppReadmes?.length, ctx, 404, 'Readme not found');

  const [{ file }] = app.AppReadmes;

  ctx.body = file;
  ctx.type = 'text/markdown';
}
