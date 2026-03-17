import { type HandleActionParams, type Options, type ServerAction } from '@appsemble/node-utils';

import {
  applyAppServiceSecrets,
  checkAppMemberAppPermissions,
  checkAppPermissions,
  checkAuthSubjectAppPermissions,
  checkUserOrganizationPermissions,
  createAppAsset,
  createAppResourcesWithAssets,
  createSettings,
  createTheme,
  deleteAppAsset,
  deleteAppResource,
  email,
  getApp,
  getAppAsset,
  getAppAssets,
  getAppBlockStyles,
  getAppDetails,
  getAppGroups,
  getAppIcon,
  getAppMessages,
  getAppReadmes,
  getAppResource,
  getAppResources,
  getAppScreenshots,
  getAppStyles,
  getAppUrl,
  getAppVariables,
  getBlockAsset,
  getBlockMessages,
  getBlocksAssetsPaths,
  getCsp,
  getCurrentAppMember,
  getCurrentAppMemberGroups,
  getCurrentAppMemberSelectedGroup,
  getDbUpdated,
  getHost,
  getSecurityEmail,
  getTheme,
  parseQuery,
  reloadUser,
  sendNotifications,
  updateAppResource,
} from './index.js';
import { handleAction as handleActionImpl } from '../utils/action.js';
import { actions } from '../utils/actions/index.js';
import { type App } from '../models/index.js';

/**
 * Wraps the server's handleAction to be compatible with the Options interface.
 * Adapts HandleActionParams to ServerActionParameters.
 */
const handleAction = (serverAction: ServerAction, params: HandleActionParams): Promise<any> =>
  handleActionImpl(serverAction as any, {
    app: params.app as App,
    action: params.action,
    mailer: params.mailer,
    data: params.data,
    options: params.options,
    context: params.context,
  });

/**
 * Server actions available for webhook execution.
 * Maps action types to their server-side implementations.
 */
const serverActions = Object.fromEntries(
  Object.entries(actions).map(([key, action]) => [key, action as ServerAction]),
) as Options['serverActions'];

export const options: Options = {
  checkUserOrganizationPermissions,
  checkAppMemberAppPermissions,
  checkAuthSubjectAppPermissions,
  checkAppPermissions,
  getAppAssets,
  getCurrentAppMember,
  getCurrentAppMemberGroups,
  getSecurityEmail,
  applyAppServiceSecrets,
  createAppAsset,
  createAppResourcesWithAssets,
  createSettings,
  createTheme,
  deleteAppAsset,
  deleteAppResource,
  email,
  getApp,
  getAppAsset,
  getAppBlockStyles,
  getAppDetails,
  getAppIcon,
  getAppMessages,
  getAppReadmes,
  getAppResource,
  getAppResources,
  getAppScreenshots,
  getAppStyles,
  getAppGroups,
  getAppUrl,
  getAppVariables,
  getBlockAsset,
  getBlockMessages,
  getBlocksAssetsPaths,
  getCsp,
  getCurrentAppMemberSelectedGroup,
  getDbUpdated,
  getHost,
  getTheme,
  parseQuery,
  reloadUser,
  sendNotifications,
  updateAppResource,
  handleAction,
  serverActions,
};
