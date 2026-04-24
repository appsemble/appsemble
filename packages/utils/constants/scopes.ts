/**
 * All known OAuth2 scopes for client credentials.
 */
export const scopes = [
  'apps:export',
  'apps:write',
  'apps:delete',
  'blocks:write',
  'blocks:delete',
  'organizations:write',
  'resources:read',
  'resources:write',
  'assets:write',
  'groups:read',
  'groups:write',
] as const;

export const appOAuth2Scopes = {
  email: 'Read the user email address.',
  openid: 'Login the user to the requesting app using OpenID.',
  profile: 'Read the user profile, including the display name and profile picture.',
  'resources:manage': 'Manage app resources on behalf of a user.',
  'groups:read': 'Read the groups the user is a part of.',
  'groups:write': 'Add new members to a group.',
} as const;

export const appOAuth2Scope = Object.keys(appOAuth2Scopes).join(' ');
