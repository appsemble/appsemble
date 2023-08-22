/**
 * All known OAuth2 scopes for client credentials.
 */
export const scopes = [
  'apps:write',
  'blocks:write',
  'blocks:delete',
  'organizations:write',
  'resources:read',
  'resources:write',
  'assets:write',
  'teams:read',
  'teams:write',
] as const;
