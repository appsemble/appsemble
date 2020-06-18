import type { Migration } from '../utils/migrate';
import postgresql from './0.9.0-postgresql';
import notifications from './0.9.3-notifications';
import templates from './0.9.4-app-templates-ratings';
import organizationRolesAndAuthentication from './0.10.0-organization-roles-and-authentication';
import rolesSubscriptionsAssociations from './0.11.0-roles-subscriptions-associations';
import nonNullableAssetAppId from './0.11.3-non-nullable-asset-app-id';
import removeBlockDefinition from './0.12.4-remove-block-definition';
import blockIcon from './0.12.6-block-icon';
import userUuid from './0.13.0-user-uuid';
import oauth2LoginFixesBlockDescriptions from './0.13.1-oauth2-login-fixes-block-descriptions';
import convertEvents from './0.13.2-convert-events';
import fixAppLoginFlow from './0.13.3-fix-app-login-flow';

export default [
  postgresql,
  notifications,
  templates,
  organizationRolesAndAuthentication,
  rolesSubscriptionsAssociations,
  nonNullableAssetAppId,
  removeBlockDefinition,
  blockIcon,
  userUuid,
  oauth2LoginFixesBlockDescriptions,
  convertEvents,
  fixAppLoginFlow,
] as Migration[];
