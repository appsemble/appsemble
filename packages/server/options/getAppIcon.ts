import { type GetAppSubEntityParams } from '@appsemble/node-utils';

import { App, Organization } from '../models/index.js';

export async function getAppIcon({ app }: GetAppSubEntityParams): Promise<Buffer> {
  const persistedApp = await App.findOne({
    attributes: ['icon'],
    where: { id: app.id },
    include: [
      {
        model: Organization,
      },
    ],
  });

  return app.iconUrl ? persistedApp.icon : persistedApp.Organization.icon;
}
