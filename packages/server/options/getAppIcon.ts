import { GetAppSubEntityParams } from 'packages/node-utils/server/routes/types';

import { App } from '../models';

export const getAppIcon = async ({ app }: GetAppSubEntityParams): Promise<Buffer> => {
  const persistedApp = await App.findOne({
    attributes: ['icon'],
    where: { id: app.id },
  });

  return persistedApp.icon;
};
