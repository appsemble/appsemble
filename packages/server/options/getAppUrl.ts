import { type GetAppSubEntityParams } from '@appsemble/node-utils';

import { App } from '../models/index.js';
import { getAppUrl as getServerAppUrl } from '../utils/app.js';

export const getAppUrl = async ({ app }: GetAppSubEntityParams): Promise<URL> => {
  const persistedApp = await App.findOne({
    attributes: ['domain', 'path', 'OrganizationId'],
    where: { id: app.id },
  });

  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  return getServerAppUrl(persistedApp);
};
