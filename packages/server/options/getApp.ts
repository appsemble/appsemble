import { type GetAppParams } from '@appsemble/node-utils';
import { type App as AppInterface } from '@appsemble/types';
import { type FindOptions } from 'sequelize';

import { getApp as getServerApp } from '../utils/app.js';

export async function getApp({ context, query }: GetAppParams): Promise<AppInterface> {
  const { app } = await getServerApp(context, query as FindOptions);
  // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
  return app ? app.toJSON() : null;
}
