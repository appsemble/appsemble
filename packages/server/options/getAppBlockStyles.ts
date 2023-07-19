import {
  type AppBlockStyle as AppBlockStyleInterface,
  type GetAppBlockStylesParams,
} from '@appsemble/node-utils';

import { AppBlockStyle } from '../models/index.js';

export async function getAppBlockStyles({
  app,
  name,
}: GetAppBlockStylesParams): Promise<AppBlockStyleInterface[]> {
  const appBlockStyles = await AppBlockStyle.findAll({
    attributes: ['style'],
    where: { AppId: app.id, block: name },
  });

  return appBlockStyles.map((appBlockStyle) => ({
    style: appBlockStyle.style,
  }));
}
