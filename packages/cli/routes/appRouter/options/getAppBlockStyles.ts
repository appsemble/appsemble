import {
  AppBlockStyle as AppBlockStyleInterface,
  GetAppBlockStylesParams,
} from '@appsemble/node-utils/types';

import { AppBlockStyle } from '../../../mocks/db/models/AppBlockStyle.js';

export const getAppBlockStyles = async ({
  app,
  name,
}: GetAppBlockStylesParams): Promise<AppBlockStyleInterface[]> => {
  const appBlockStyles = await AppBlockStyle.findAll({
    where: { AppId: app.id, block: name },
  });

  return appBlockStyles.map((appBlockStyle) => ({
    style: appBlockStyle.style,
  }));
};
