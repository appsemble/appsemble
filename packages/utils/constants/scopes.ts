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
