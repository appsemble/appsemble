import {
  type AppBlockStyle as AppBlockStyleInterface,
  type GetAppBlockStylesParams,
} from '@appsemble/node-utils';

import { App, getAppDB } from '../models/index.js';
import { getAppStyle } from '../utils/app.js';

export async function getAppBlockStyles({
  app,
  name,
}: GetAppBlockStylesParams): Promise<AppBlockStyleInterface[]> {
  const { AppBlockStyle } = await getAppDB(app.id!);
  const persistedApp = (await App.findByPk(app.id, { attributes: ['id', 'password'] }))!;
  const appBlockStyles = await AppBlockStyle.findAll({
    attributes: ['style'],
    where: { block: name },
  });

  return appBlockStyles.map((appBlockStyle) => ({
    style: getAppStyle(persistedApp, appBlockStyle.style),
  }));
}
