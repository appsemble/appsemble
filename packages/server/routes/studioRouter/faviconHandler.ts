import { readAsset } from '@appsemble/node-utils';
import { Context } from 'koa';

export async function faviconHandler(ctx: Context): Promise<void> {
  ctx.body = await readAsset('favicon.ico');
  ctx.type = 'image/x-icon';
}
