import { type AppStyles, type GetAppParams } from '@appsemble/node-utils';

import { getApp as getServerApp, getAppStyle } from '../utils/app.js';

export async function getAppStyles({ context, query }: GetAppParams): Promise<AppStyles> {
  const { app } = await getServerApp(context, {
    ...query,
    attributes: ['id', 'password', 'coreStyle', 'sharedStyle'],
  });
  if (app) {
    return {
      coreStyle: getAppStyle(context, app, app.coreStyle),
      sharedStyle: getAppStyle(context, app, app.sharedStyle),
    };
  }
  // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
  return null;
}
