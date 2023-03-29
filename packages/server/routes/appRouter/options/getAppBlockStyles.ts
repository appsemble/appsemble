import {
  AppBlockStyle as AppBlockStyleInterface,
  GetAppBlockStylesParams,
} from 'packages/node-utils/server/routes/types';

import { AppBlockStyle } from '../../../models/index.js';

export const getAppBlockStyles = async ({
  app,
  name,
}: GetAppBlockStylesParams): Promise<AppBlockStyleInterface[]> => {
  const appBlockStyles = await AppBlockStyle.findAll({
    attributes: ['style'],
    where: { AppId: app.id, block: name },
  });

  return appBlockStyles.map((appBlockStyle) => ({
    style: appBlockStyle.style,
  }));
};
