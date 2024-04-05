import { readAsset } from '@appsemble/node-utils';
import { type Context } from 'koa';

export async function securitytxtHandler(ctx: Context): Promise<void> {
  ctx.body = await readAsset('security.txt', 'utf8');
}
