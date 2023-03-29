import { GetAppSubEntityParams } from 'packages/node-utils/server/routes/types';

import { App } from '../../../models/index.js';

export const getAppIcon = async ({ app }: GetAppSubEntityParams): Promise<Buffer> => {
  const persistedApp = await App.findOne({
    attributes: ['icon'],
    where: { id: app.id },
  });

  return persistedApp.icon;
};
