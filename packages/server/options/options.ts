import { type Options } from '@appsemble/node-utils';

import {
  applyAppServiceSecrets,
  checkRole,
  createAppAsset,
  createAppResourcesWithAssets,
  createSettings,
  createTheme,
  deleteAppAsset,
  deleteAppResource,
  email,
  getApp,
  getAppAssets,
  getAppBlockStyles,
  getAppDetails,
  getAppIcon,
  getAppMembers,
  getAppMessages,
  getAppReadmes,
  getAppResource,
  getAppResources,
  getAppScreenshots,
  getAppStyles,
  getAppTeams,
  getAppUrl,
  getAppUserInfo,
  getAppVariables,
  getBlockAsset,
  getBlockMessages,
  getBlocksAssetsPaths,
  getCsp,
  getDbUpdated,
  getHost,
  getTheme,
  parseQuery,
  reloadUser,
  sendNotifications,
  updateAppResource,
  verifyResourceActionPermission,
} from './index.js';

export const options: Options = {
  applyAppServiceSecrets,
  checkRole,
  createAppAsset,
  createAppResourcesWithAssets,
  createSettings,
  createTheme,
  deleteAppAsset,
  deleteAppResource,
  email,
  getApp,
  getAppAssets,
  getAppBlockStyles,
  getAppDetails,
  getAppIcon,
  getAppMembers,
  getAppMessages,
  getAppReadmes,
  getAppResource,
  getAppResources,
  getAppScreenshots,
  getAppStyles,
  getAppTeams,
  getAppUrl,
  getAppUserInfo,
  getAppVariables,
  getBlockAsset,
  getBlockMessages,
  getBlocksAssetsPaths,
  getCsp,
  getDbUpdated,
  getHost,
  getTheme,
  parseQuery,
  reloadUser,
  sendNotifications,
  updateAppResource,
  verifyResourceActionPermission,
};
