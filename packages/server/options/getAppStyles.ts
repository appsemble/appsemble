import { type AppStyles, type GetAppParams } from '@appsemble/node-utils';

import { getApp as getServerApp } from '../utils/app.js';

export async function getAppStyles({ context, query }: GetAppParams): Promise<AppStyles> {
  const { app } = await getServerApp(context, query);
  return app || null;
}
