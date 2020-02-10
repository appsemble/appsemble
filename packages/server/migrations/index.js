import postgresql from './0.9.0-postgresql';
import notifications from './0.9.3-notifications';
import templates from './0.9.4-app-templates-ratings';
import organizationRolesAndAuthentication from './0.10.0-organization-roles-and-authentication';
import appRoles from './0.10.1-app-roles';
import resourceSubscriptions from './0.10.2-resource-subscriptions';
import assetAssociations from './0.10.3-asset-associations';
import events from './0.10.4-events';

export default [
  postgresql,
  notifications,
  templates,
  organizationRolesAndAuthentication,
  appRoles,
  resourceSubscriptions,
  assetAssociations,
  events,
];
