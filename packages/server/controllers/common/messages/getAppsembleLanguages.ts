import { getSupportedLanguages } from '@appsemble/node-utils';
import { type Context } from 'koa';

export async function getAppsembleLanguages(ctx: Context): Promise<void> {
  const languages = await getSupportedLanguages();
  ctx.body = [...languages].sort();
}
