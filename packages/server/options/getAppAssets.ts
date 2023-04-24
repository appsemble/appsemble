import { AppAsset, GetAppSubEntityParams } from '@appsemble/node-utils/server/types';

import { Asset } from '../models/index.js';

export const getAppAssets = ({ app }: GetAppSubEntityParams): Promise<AppAsset[]> =>
  Asset.findAll({
    where: {
      AppId: app.id,
    },
  });
