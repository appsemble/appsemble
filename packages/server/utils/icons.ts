import { type AppDefinition, parseIconReference, resolveIconReference } from '@appsemble/lang-sdk';
import { has } from '@appsemble/utils';
import { ValidationError } from 'jsonschema';
import { Op } from 'sequelize';

import { getAppDB } from '../models/index.js';

/**
 * Check an icon reference submitted for an SSO setting against the app’s icon registry.
 *
 * Bare Font Awesome names are accepted without checking them against the Font Awesome icon set, and
 * an empty icon is left to the API schema.
 *
 * @param icon The submitted icon reference.
 * @param definition The definition of the app the setting belongs to.
 * @returns An error message naming the field and the problem, or `undefined` if the icon is valid.
 */
export function getSsoIconError(icon: unknown, definition: AppDefinition): string | undefined {
  if (!icon) {
    return;
  }
  const resolved = resolveIconReference(icon, definition.icons);
  if (resolved.type === 'invalid') {
    return `The icon field ${resolved.reason}`;
  }
}

/**
 * Check that a new app definition keeps every icon key used by the stored SSO settings of an app.
 *
 * Stored icons which aren’t custom icon references are ignored. The SSO settings are only queried
 * when the new definition drops a key of the stored definition.
 *
 * @param appId The ID of the app being updated.
 * @param previous The stored app definition.
 * @param definition The new app definition.
 * @returns Validation errors naming the SSO settings which use a removed key.
 */
export async function validateStoredSsoIcons(
  appId: number,
  previous: AppDefinition,
  definition: AppDefinition,
): Promise<ValidationError[]> {
  const keepsAllKeys = Object.keys(previous.icons ?? {}).every(
    (key) => definition.icons && has(definition.icons, key),
  );
  if (keepsAllKeys) {
    return [];
  }
  const { AppOAuth2Secret, AppSamlSecret } = await getAppDB(appId);
  const where = { icon: { [Op.startsWith]: 'icon:' } };
  const [oauth2Secrets, samlSecrets] = await Promise.all([
    AppOAuth2Secret.findAll({ attributes: ['id', 'name', 'icon'], where }),
    AppSamlSecret.findAll({ attributes: ['id', 'name', 'icon'], where }),
  ]);
  const errors: ValidationError[] = [];
  for (const [type, secrets] of [
    ['OAuth2', oauth2Secrets],
    ['SAML', samlSecrets],
  ] as const) {
    for (const { icon, id, name } of secrets) {
      const parsed = parseIconReference(icon);
      if (parsed.type !== 'custom' || (definition.icons && has(definition.icons, parsed.key))) {
        continue;
      }
      errors.push(
        new ValidationError(
          `is missing the icon key “${parsed.key}”, which is used by the ${type} secret “${name}” (id ${id})`,
          definition.icons,
          undefined,
          ['icons'],
        ),
      );
    }
  }
  return errors;
}
