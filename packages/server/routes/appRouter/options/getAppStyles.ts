import { AppStyles, GetAppParams } from 'packages/node-utils/server/routes/types';

import { getApp as getServerApp } from '../../../utils/app.js';

export const getAppStyles = async ({ context, query }: GetAppParams): Promise<AppStyles> => {
  const { app } = await getServerApp(context, query);
  return app || null;
};
