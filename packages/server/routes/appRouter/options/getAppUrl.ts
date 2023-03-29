import { GetAppSubEntityParams } from 'packages/node-utils/server/routes/types';

import { App } from '../../../models/index.js';
import { getAppUrl as getServerAppUrl } from '../../../utils/app.js';

export const getAppUrl = async ({ app }: GetAppSubEntityParams): Promise<URL> => {
  const persistedApp = await App.findOne({
    attributes: ['domain', 'path', 'OrganizationId'],
    where: { id: app.id },
  });

  return getServerAppUrl(persistedApp);
};
