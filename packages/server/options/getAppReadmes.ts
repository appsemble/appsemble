import {
  type AppReadme as AppReadmeInterface,
  type GetAppSubEntityParams,
} from '@appsemble/node-utils';

import { AppReadme } from '../models/index.js';

export async function getAppReadmes({ app }: GetAppSubEntityParams): Promise<AppReadmeInterface[]> {
  const appReadmes = await AppReadme.findAll({
    attributes: ['id', 'file'],
    where: { AppId: app.id },
  });

  return appReadmes.map((appReadme) => ({
    id: appReadme.id,
    file: appReadme.file,
  }));
}
