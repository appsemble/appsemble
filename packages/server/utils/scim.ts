import { argv } from './argv.js';

export const SCIM_LIST_RESPONSE = 'urn:ietf:params:scim:api:messages:2.0:ListResponse';

/**
 * Get the SCIM location given an app ID and a path segment
 *
 * @param appId The app ID.
 * @param pathSegment The path segment to append.
 * @returns The prefix for SCIM endpoints.
 */
export function getScimLocation(appId: number, pathSegment: string): string {
  return String(new URL(`/api/apps/${appId}/scim/${pathSegment}`, argv.host));
}
