import { type Context } from 'koa';

import { readAsset } from '../../utils/readAsset.js';

export async function faviconHandler(ctx: Context): Promise<void> {
  ctx.body = await readAsset('favicon.ico');
  ctx.type = 'image/x-icon';
}
