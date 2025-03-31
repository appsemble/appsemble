import { type GetDbUpdatedParams } from '@appsemble/node-utils';

import { App, Organization } from '../models/index.js';

export async function getDbUpdated({ app, maskable }: GetDbUpdatedParams): Promise<Date | number> {
  const persistedApp = (await App.findOne({
    attributes: ['maskableIcon', 'icon', 'updated'],
    where: { id: app.id },
    include: [
      {
        model: Organization,
        attributes: ['updated'],
      },
    ],
  }))!;

  return persistedApp && ((maskable && persistedApp.maskableIcon) || persistedApp.icon)
    ? persistedApp.updated
    : persistedApp.Organization!.updated;
}
