import { GetAppParams, RawApp } from '@appsemble/node-utils/types';

import { getApp as getServerApp } from '../../../utils/app.js';

export const getAppRaw = async ({ context, query }: GetAppParams): Promise<RawApp> => {
  const { app } = await getServerApp(context, query);
  return app || null;
};
