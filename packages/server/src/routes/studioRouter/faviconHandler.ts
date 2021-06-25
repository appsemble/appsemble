import { KoaContext } from '../../types';
import { readAsset } from '../../utils/readAsset';

export async function faviconHandler(ctx: KoaContext): Promise<void> {
  ctx.body = await readAsset('favicon.ico');
  ctx.type = 'image/x-icon';
}
