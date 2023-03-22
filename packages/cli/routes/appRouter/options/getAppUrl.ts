import { GetAppSubEntityParams } from '@appsemble/node-utils/types';

import { App } from '../../../mocks/db/models/App.js';
import { getAppUrl as getServerAppUrl } from '../../../mocks/utils/app.js';

export const getAppUrl = async ({ app }: GetAppSubEntityParams): Promise<URL> => {
  const persistedApp = await App.findOne({
    where: { id: app.id },
  });

  return getServerAppUrl(persistedApp);
};
