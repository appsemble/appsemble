import { Organization } from '@appsemble/types';
import { normalize } from '@appsemble/utils';

/**
 * Calculate an organization id based on a given organization name.
 *
 * @param name - The name to base the ID on.
 * @param newValues - The new values to apply the ID on.
 * @param oldValues - The old values to compare the ID to.
 * @returns An updated organization object containing the new ID.
 */
export function preprocessOrganization(
  name: string,
  newValues: Organization,
  oldValues: Organization,
): Organization {
  if (name !== 'name') {
    return newValues;
  }
  if (normalize(oldValues.name) === oldValues.id) {
    return {
      ...newValues,
      id: normalize(newValues.name).slice(0, 30).replace(/-+$/, ''),
    };
  }
  return newValues;
}
