import { GetAppSubEntityParams } from '@appsemble/node-utils/types';

import { App } from '../../../mocks/db/models/App.js';

export const getAppIcon = async ({ app }: GetAppSubEntityParams): Promise<Buffer> => {
  const persistedApp = await App.findOne({
    where: { id: app.id },
  });

  return persistedApp.icon;
};
