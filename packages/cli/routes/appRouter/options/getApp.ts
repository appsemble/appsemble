import { GetAppParams } from '@appsemble/node-utils/types';
import { App as AppInterface } from '@appsemble/types';

import { getApp as getCliApp } from '../../../mocks/utils/app.js';

export const getApp = async ({ context, query }: GetAppParams): Promise<AppInterface> => {
  const { app } = await getCliApp(context, query);
  return app;
};
