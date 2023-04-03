import { GetAppParams } from '@appsemble/node-utils/server/routes/types.js';
import { App as AppInterface } from '@appsemble/types';

import { getApp as getServerApp } from '../../../utils/app.js';

export const getApp = async ({ context, query }: GetAppParams): Promise<AppInterface> => {
  const { app } = await getServerApp(context, query);
  return app ? app.toJSON() : null;
};
