import { AppRouterOptions } from '@appsemble/node-utils/types';

import { createSettings } from './createSettings.js';
import { createTheme } from './createTheme.js';
import { getApp } from './getApp.js';
import { getAppBlockStyles } from './getAppBlockStyles.js';
import { getAppDetails } from './getAppDetails.js';
import { getAppIcon } from './getAppIcon.js';
import { getAppLanguages } from './getAppLanguages.js';
import { getAppScreenshots } from './getAppScreenshots.js';
import { getAppStyles } from './getAppStyles.js';
import { getAppUrl } from './getAppUrl.js';
import { getBlockAsset } from './getBlockAsset.js';
import { getBlocksAssetsPaths } from './getBlockAssetsPaths.js';
import { getCsp } from './getCsp.js';
import { getDbUpdated } from './getDbUpdated.js';
import { getHost } from './getHost.js';
import { getTheme } from './getTheme.js';

export const options: AppRouterOptions = {
  getApp,
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
