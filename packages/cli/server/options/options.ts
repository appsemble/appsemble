import { Options } from '@appsemble/node-utils/server/types';

import { createSettings } from './createSettings';
import { createTheme } from './createTheme';
import { getApp } from './getApp';
import { getAppMessages } from './getAppMessages';
import { getAppBlockStyles } from './getAppBlockStyles';
import { getAppDetails } from './getAppDetails';
import { getAppIcon } from './getAppIcon';
import { getAppLanguages } from './getAppLanguages';
import { getAppScreenshots } from './getAppScreenshots';
import { getAppStyles } from './getAppStyles';
import { getAppUrl } from './getAppUrl';
import { getBlockAsset } from './getBlockAsset';
import { getBlocksAssetsPaths } from './getBlockAssetsPaths';
import { getCsp } from './getCsp';
import { getDbUpdated } from './getDbUpdated';
import { getHost } from './getHost';
import { getTheme } from './getTheme';

export const options: Options = {
  getApp,
  getAppMessages,
  getAppDetails,
  getAppStyles,
  getAppScreenshots,
  getAppBlockStyles,
  getAppIcon,
  getAppUrl,
  getAppLanguages,
  getDbUpdated,
  getBlockAsset,
  getBlocksAssetsPaths,
  getTheme,
  createTheme,
  getHost,
  getCsp,
  createSettings,
};
