import { type PredefinedOrganizationRole } from './roles.js';

export const organizationLoginMethods = ['password', 'github', 'gitlab', 'google', 'oidc'] as const;

export type OrganizationLoginMethod = (typeof organizationLoginMethods)[number];

export interface OrganizationSsoRoleMapping {
  group: string;
  role: PredefinedOrganizationRole;
}

export interface OrganizationSsoConfiguration {
  issuer: string;
  clientId: string;
  clientSecret?: string;
  name: string;
  scope: string;
  groupClaim: string;
  roleMappings: OrganizationSsoRoleMapping[];
  policy: 'optional' | 'required' | 'required-with-guests';
  allowedLoginMethods: OrganizationLoginMethod[];
}

export interface OrganizationSsoSettings extends Omit<
  OrganizationSsoConfiguration,
  'clientSecret'
> {
  managedBy: 'studio' | 'deployment';
  hasClientSecret: boolean;
}
