import { GetAppParams } from 'packages/node-utils/server/types';
import { App as AppInterface } from '@appsemble/types';

import { getApp as getServerApp } from '../utils/app';

export const getApp = async ({ context, query }: GetAppParams): Promise<AppInterface> => {
  const { app } = await getServerApp(context, query);
  return app ? app.toJSON() : null;
};
