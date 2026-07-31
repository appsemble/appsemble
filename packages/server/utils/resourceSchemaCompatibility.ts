import { isDeepStrictEqual } from 'node:util';

import { type ResourceDefinition } from '@appsemble/lang-sdk';
import { AppsembleError } from '@appsemble/node-utils';
import { type Schema, Validator } from 'jsonschema';
import { QueryTypes, type Transaction } from 'sequelize';

import { getAppDB } from '../models/index.js';

export class ResourceSchemaConflictError extends AppsembleError {
  readonly resourceType: string;

  constructor(resourceType: string) {
    super(
      `Can’t change the schema of resource “${resourceType}” because existing resources don’t comply with the new schema. Update or delete the conflicting resources before publishing this app.`,
    );
    this.name = 'ResourceSchemaConflictError';
    this.resourceType = resourceType;
  }
}

/**
 * Return a copy of a JSON schema that permits undeclared properties.
 *
 * Every `additionalProperties: false` in the schema tree is dropped, restoring the permissive
 * default. This scopes the compatibility guard to declared fields: removing a property from a
 * resource schema, or leaving unrelated data behind, never rejects existing resources, matching how
 * Appsemble tolerates undeclared resource data elsewhere. Constraints on declared properties (type,
 * format, required, enum, numeric and length bounds) stay intact.
 *
 * @param schema The schema to relax.
 * @returns A deep copy with `additionalProperties: false` removed at every level.
 */
function allowAdditionalProperties(schema: unknown): unknown {
  if (Array.isArray(schema)) {
    return schema.map((item) => allowAdditionalProperties(item));
  }

  if (schema && typeof schema === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(schema as Record<string, unknown>)) {
      if (key === 'additionalProperties' && value === false) {
        continue;
      }
      result[key] = allowAdditionalProperties(value);
    }
    return result;
  }

  return schema;
}

/**
 * Reject a resource definition change whose new schema existing resources can’t satisfy.
 *
 * For every resource type whose schema actually changed, the live rows (`deleted IS NULL`, including
 * rows still in the default partition) are validated against the new schema. If any declared field
 * of an existing resource would become invalid — a retyped value, a narrowed enum, a newly required
 * property that is missing — the change is rejected with a {@link ResourceSchemaConflictError}, the
 * same way {@link ../utils/resourceUniqueIndexes.assertResourceUniqueConstraintValues} prevalidates
 * data before applying a unique constraint.
 *
 * Undeclared/extra data is ignored (see {@link allowAdditionalProperties}): tightening
 * `additionalProperties` or dropping a property never rejects existing resources. Asset references
 * are strings the write path already validates, so the `binary` format is treated as satisfied
 * here.
 *
 * Only paths with a prior definition (an app patch) can reject; on app creation, import, or template
 * cloning `previousDefinitions` is absent and there is no existing data to protect, so this is a
 * no-op.
 *
 * @param appId The app whose per-app resource database should be checked.
 * @param previousDefinitions The resource definitions before the change.
 * @param nextDefinitions The resource definitions being applied.
 * @param transaction The surrounding app DB transaction, when available.
 */
export async function assertResourceSchemaCompatibility(
  appId: number,
  previousDefinitions?: Record<string, ResourceDefinition>,
  nextDefinitions?: Record<string, ResourceDefinition>,
  transaction?: Transaction,
): Promise<void> {
  if (!previousDefinitions || !nextDefinitions) {
    return;
  }

  const { sequelize } = await getAppDB(appId);
  const validator = new Validator();
  validator.customFormats.binary = () => true;

  for (const [resourceType, nextDefinition] of Object.entries(nextDefinitions)) {
    const previousDefinition = previousDefinitions[resourceType];

    if (!previousDefinition) {
      continue;
    }

    if (isDeepStrictEqual(previousDefinition.schema, nextDefinition.schema)) {
      continue;
    }

    const guardSchema = allowAdditionalProperties(nextDefinition.schema) as Schema;

    const rows = await sequelize.query<{ data: unknown }>(
      'SELECT data FROM "Resource" WHERE type = :type AND deleted IS NULL',
      { replacements: { type: resourceType }, transaction, type: QueryTypes.SELECT },
    );

    const hasIncompatibleRow = rows.some(
      (row) => !validator.validate(row.data, guardSchema, { nestedErrors: true }).valid,
    );

    if (hasIncompatibleRow) {
      throw new ResourceSchemaConflictError(resourceType);
    }
  }
}
