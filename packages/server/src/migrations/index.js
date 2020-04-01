import postgresql from './0.9.0-postgresql';
import notifications from './0.9.3-notifications';
import templates from './0.9.4-app-templates-ratings';
import organizationRolesAndAuthentication from './0.10.0-organization-roles-and-authentication';
import rolesSubscriptionsAssociations from './0.11.0-roles-subscriptions-associations';
import nonNullableAssetAppId from './0.11.3-non-nullable-asset-app-id';
import removeBlockDefinition from './0.12.0-remove-block-definition';

export default [
  postgresql,
  notifications,
  templates,
  organizationRolesAndAuthentication,
  rolesSubscriptionsAssociations,
  nonNullableAssetAppId,
  removeBlockDefinition,
];
