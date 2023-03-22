import { GetAppParams, RawApp } from '@appsemble/node-utils/types';

import { getApp as getCliApp } from '../../../mocks/utils/app.js';

export const getAppRaw = async ({ context, query }: GetAppParams): Promise<RawApp> => {
  const { app } = await getCliApp(context, query);
  return app || null;
};
