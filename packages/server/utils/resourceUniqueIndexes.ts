import { createHash } from 'node:crypto';

import {
  inferResourceUniqueFieldType,
  normalize,
  type AppDefinition,
  type ResourceDefinition,
} from '@appsemble/lang-sdk';
import { AppsembleError, throwKoaError } from '@appsemble/node-utils';
import { type Schema, Validator } from 'jsonschema';
import { type Context } from 'koa';
import { UniqueConstraintError, type Transaction } from 'sequelize';

import { getAppDB } from '../models/index.js';

const schemaValidator = new Validator();
type SqlLiteralValue = boolean | Date | number | string;

function formatFields(fields: string[]): string {
  return fields.map((field) => `“${field}”`).join(', ');
}

export class ResourceUniqueConstraintConflictError extends AppsembleError {
  readonly resourceType: string;

  readonly fields: string[];

  constructor(resourceType: string, fields: string[]) {
    super(
      `Can’t apply unique constraint to resource “${resourceType}” for fields ${formatFields(fields)} because existing resources contain duplicates. Update or delete the conflicting resources before publishing this app.`,
    );
    this.name = 'ResourceUniqueConstraintConflictError';
    this.resourceType = resourceType;
    this.fields = fields;
  }
}

export class ResourceUniqueConstraintValueError extends AppsembleError {
  readonly resourceType: string;

  readonly field: string;

  constructor(resourceType: string, field: string) {
    super(
      `Can’t apply unique constraint to resource “${resourceType}” for field “${field}” because some values do not comply with the field schema.`,
    );
    this.name = 'ResourceUniqueConstraintValueError';
    this.resourceType = resourceType;
    this.field = field;
  }
}

export class ResourceUniqueConstraintViolationError extends AppsembleError {
  readonly resourceType: string;

  readonly fields: string[];

  constructor(resourceType: string, fields: string[]) {
    super(
      `A resource of type “${resourceType}” with the same values for fields ${formatFields(fields)} already exists.`,
    );
    this.name = 'ResourceUniqueConstraintViolationError';
    this.resourceType = resourceType;
    this.fields = fields;
  }
}

function getUniqueConstraints(resourceDefinition?: ResourceDefinition): string[][] {
  return (resourceDefinition?.unique ?? []).map((constraint) =>
    Array.isArray(constraint) ? [...constraint].toSorted() : [constraint],
  );
}

function getUniqueFieldSchema(
  resourceDefinition: ResourceDefinition,
  field: string,
): Schema | undefined {
  return resourceDefinition.schema.properties?.[field] as Schema | undefined;
}

function getUniqueFieldType(
  resourceType: string,
  resourceDefinition: ResourceDefinition,
  field: string,
): string {
  const type = inferResourceUniqueFieldType(
    getUniqueFieldSchema(resourceDefinition, field) as Record<string, any> | undefined,
  );

  if (!type) {
    throw new Error(
      `Expected resource “${resourceType}” unique constraint field “${field}” to be validated by @appsemble/lang-sdk.`,
    );
  }

  return type;
}

/**
 * Validate that resource values participating in unique constraints comply with
 * the declared field schemas.
 *
 * Use this before applying unique indexes to raw resource payloads such as
 * imported or cloned data, so invalid values fail with a user-facing `400`
 * instead of a database cast error.
 *
 * @param resourceType The resource type being validated.
 * @param resourceDefinition The resource definition that contains `unique`.
 * @param resources The resource payloads to validate.
 */
export function assertResourceUniqueConstraintSchemaValues(
  resourceType: string,
  resourceDefinition: ResourceDefinition,
  resources: readonly Record<string, unknown>[],
): void {
  const requiredFields = new Set(resourceDefinition.schema.required ?? []);

  for (const fields of getUniqueConstraints(resourceDefinition)) {
    for (const field of fields) {
      const schema = getUniqueFieldSchema(resourceDefinition, field);

      const isRequired = requiredFields.has(field);
      const validationSchema = schema
        ? { ...schema, required: isRequired }
        : { required: isRequired };
      const hasInvalidValue = resources.some((resource) => {
        if (!isRequired && resource[field] === undefined) {
          return false;
        }

        const { valid } = schemaValidator.validate(resource[field], validationSchema, {
          nestedErrors: true,
        });

        return !valid;
      });

      if (hasInvalidValue) {
        throw new ResourceUniqueConstraintValueError(resourceType, field);
      }
    }
  }
}

function getFieldExpression(
  sequelizeEscape: (value: SqlLiteralValue) => string,
  resourceType: string,
  resourceDefinition: ResourceDefinition,
  field: string,
): string {
  const type = getUniqueFieldType(resourceType, resourceDefinition, field);

  const extracted = `(data->>${sequelizeEscape(field)})`;

  switch (type) {
    case 'boolean':
      return `(${extracted})::boolean`;
    case 'integer':
      return `(${extracted})::bigint`;
    case 'number':
      return `(${extracted})::numeric`;
    case 'string':
      return extracted;
    default:
      throw new Error(
        `Expected resource “${resourceType}” unique constraint field “${field}” to be validated by @appsemble/lang-sdk.`,
      );
  }
}

function getFieldValueLiteral(
  sequelizeEscape: (value: SqlLiteralValue) => string,
  resourceType: string,
  resourceDefinition: ResourceDefinition,
  field: string,
  value: unknown,
): string {
  const type = getUniqueFieldType(resourceType, resourceDefinition, field);

  switch (type) {
    case 'boolean':
      return `${sequelizeEscape(Boolean(value))}::boolean`;
    case 'integer':
      return `${sequelizeEscape(Number(value))}::bigint`;
    case 'number':
      return `${sequelizeEscape(Number(value))}::numeric`;
    case 'string':
      return sequelizeEscape(String(value));
    default:
      throw new Error(
        `Expected resource “${resourceType}” unique constraint field “${field}” to be validated by @appsemble/lang-sdk.`,
      );
  }
}

/**
 * Build a deterministic index name for a resource uniqueness constraint.
 *
 * Use this when code needs to refer back to the generated PostgreSQL index
 * name, for example while resolving a DB unique violation to a resource type
 * and field list.
 *
 * @param resourceType The resource type the constraint belongs to.
 * @param fields The fields that participate in the uniqueness constraint.
 * @param resourceDefinition The resource definition used to derive field-type-specific index names.
 * @returns A stable index name derived from the resource type and fields.
 */
export function getResourceUniqueIndexName(
  resourceType: string,
  fields: string[],
  resourceDefinition?: ResourceDefinition,
): string {
  const normalizedFields = [...fields].toSorted();
  const hash = createHash('sha1')
    .update(
      `${resourceType}:${normalizedFields
        .map((field) => {
          const propertySchema = resourceDefinition?.schema.properties?.[field] as
            | Record<string, any>
            | undefined;

          return `${field}:${inferResourceUniqueFieldType(propertySchema) || 'unknown'}`;
        })
        .join('\0')}`,
    )
    .digest('hex');
  const normalizedType = normalize(resourceType).replaceAll('-', '_').slice(0, 20) || 'resource';

  return `UniqueResource_${normalizedType}_${hash.slice(0, 16)}`;
}

function getResourceUniqueIndexSpecification(
  sequelizeEscape: (value: SqlLiteralValue) => string,
  resourceType: string,
  resourceDefinition: ResourceDefinition,
  fields: string[],
): { expressions: string[]; fields: string[]; name: string; resourceType: string } {
  const normalizedFields = [...fields].toSorted();

  return {
    expressions: normalizedFields.map((field) =>
      getFieldExpression(sequelizeEscape, resourceType, resourceDefinition, field),
    ),
    fields: normalizedFields,
    name: getResourceUniqueIndexName(resourceType, normalizedFields, resourceDefinition),
    resourceType,
  };
}

function getDesiredResourceUniqueIndexes(
  sequelizeEscape: (value: SqlLiteralValue) => string,
  resourceDefinitions: Record<string, ResourceDefinition> = {},
): Map<string, { expressions: string[]; fields: string[]; name: string; resourceType: string }> {
  return new Map(
    Object.entries(resourceDefinitions)
      .flatMap(([resourceType, resourceDefinition]) =>
        getUniqueConstraints(resourceDefinition).map((fields) =>
          getResourceUniqueIndexSpecification(
            sequelizeEscape,
            resourceType,
            resourceDefinition,
            fields,
          ),
        ),
      )
      .map((specification) => [specification.name, specification]),
  );
}

async function assertNoDuplicateResourceConstraintValues(
  resourceType: string,
  fields: string[],
  expressions: string[],
  appId: number,
  transaction?: Transaction,
): Promise<void> {
  const { sequelize } = await getAppDB(appId);
  const aliases = expressions.map((unused, index) => `value${index}`);
  const escapedResourceType = sequelize.escape(resourceType);
  const nonNullChecks = aliases.map((alias) => `"${alias}" IS NOT NULL`).join(' AND ');
  const projectedFields = expressions.map(
    (expression, index) => `${expression} AS "${aliases[index]}"`,
  );
  const groupedFields = aliases.map((alias) => `"${alias}"`).join(', ');

  const [duplicates] = await sequelize.query(
    `
      SELECT 1
      FROM (
        SELECT ${projectedFields.join(', ')}
        FROM "Resource"
        WHERE type = ${escapedResourceType} AND deleted IS NULL
      ) AS "ResourceConstraintCandidates"
      WHERE ${nonNullChecks}
      GROUP BY ${groupedFields}
      HAVING COUNT(*) > 1
      LIMIT 1;
    `,
    { transaction },
  );

  if (Array.isArray(duplicates) && duplicates.length) {
    throw new ResourceUniqueConstraintConflictError(resourceType, fields);
  }
}

function getDatabaseErrorField(error: unknown, field: 'code' | 'detail'): string | undefined {
  const value = (error as Record<string, unknown> | null | undefined)?.[field];

  return typeof value === 'string' ? value : undefined;
}

function isResourceUniqueConstraintValueErrorLike(error: unknown): boolean {
  const candidate = error as
    | { message?: string; original?: { code?: string }; parent?: { code?: string } }
    | undefined;
  const originalCode = getDatabaseErrorField(candidate?.original, 'code');
  const parentCode = getDatabaseErrorField(candidate?.parent, 'code');

  return (
    originalCode === '22P02' ||
    parentCode === '22P02' ||
    /invalid input syntax for type (bigint|boolean|numeric)/i.test(candidate?.message ?? '')
  );
}

function getResourceUniqueConstraintValueError(
  resourceType: string,
  resourceDefinition: ResourceDefinition,
  fields: string[],
  error: unknown,
): ResourceUniqueConstraintValueError | undefined {
  if (!isResourceUniqueConstraintValueErrorLike(error)) {
    return undefined;
  }

  const field =
    fields.find(
      (candidateField) =>
        inferResourceUniqueFieldType(
          getUniqueFieldSchema(resourceDefinition, candidateField) as
            | Record<string, any>
            | undefined,
        ) !== 'string',
    ) ?? fields[0];

  return field ? new ResourceUniqueConstraintValueError(resourceType, field) : undefined;
}

async function createResourceUniqueIndex(
  appId: number,
  specification: { expressions: string[]; fields: string[]; name: string; resourceType: string },
  resourceDefinition: ResourceDefinition,
  transaction?: Transaction,
): Promise<void> {
  const { sequelize } = await getAppDB(appId);
  const indexExpressions = specification.expressions.map((expression) => `(${expression})`);

  try {
    await assertNoDuplicateResourceConstraintValues(
      specification.resourceType,
      specification.fields,
      specification.expressions,
      appId,
      transaction,
    );

    await sequelize.query(
      `
        CREATE UNIQUE INDEX IF NOT EXISTS "${specification.name}"
        ON "Resource" (${indexExpressions.join(', ')})
        WHERE type = ${sequelize.escape(specification.resourceType)} AND deleted IS NULL;
      `,
      { transaction },
    );
  } catch (error) {
    throw (
      getResourceUniqueConstraintValueError(
        specification.resourceType,
        resourceDefinition,
        specification.fields,
        error,
      ) ?? error
    );
  }
}

async function recreateResourceUniqueIndex(
  appId: number,
  specification: { expressions: string[]; fields: string[]; name: string; resourceType: string },
  resourceDefinition: ResourceDefinition,
  transaction?: Transaction,
): Promise<void> {
  const { sequelize } = await getAppDB(appId);
  const previousIndexName = `${specification.name}_old`;
  const indexExpressions = specification.expressions.map((expression) => `(${expression})`);

  try {
    await assertNoDuplicateResourceConstraintValues(
      specification.resourceType,
      specification.fields,
      specification.expressions,
      appId,
      transaction,
    );

    await sequelize.query(`DROP INDEX IF EXISTS "${previousIndexName}";`, { transaction });
    await sequelize.query(
      `ALTER INDEX IF EXISTS "${specification.name}" RENAME TO "${previousIndexName}";`,
      { transaction },
    );
    await sequelize.query(
      `
        CREATE UNIQUE INDEX "${specification.name}"
        ON "Resource" (${indexExpressions.join(', ')})
        WHERE type = ${sequelize.escape(specification.resourceType)} AND deleted IS NULL;
      `,
      { transaction },
    );
    await sequelize.query(`DROP INDEX IF EXISTS "${previousIndexName}";`, { transaction });
  } catch (error) {
    throw (
      getResourceUniqueConstraintValueError(
        specification.resourceType,
        resourceDefinition,
        specification.fields,
        error,
      ) ?? error
    );
  }
}

async function dropResourceUniqueIndex(
  appId: number,
  indexName: string,
  transaction?: Transaction,
): Promise<void> {
  const { sequelize } = await getAppDB(appId);

  await sequelize.getQueryInterface().removeIndex('Resource', indexName, { transaction });
}

/**
 * Synchronize DB unique indexes for the resource definitions of an app.
 *
 * This creates newly required indexes, drops indexes that are no longer part of
 * the definition, and rejects newly added constraints when existing data would
 * already violate them.
 *
 * When this runs as part of app creation, patching, import, or template
 * cloning, prefer passing the surrounding app DB transaction so definition
 * changes and index changes stay atomic.
 *
 * @param appId The app whose per-app resource database should be updated.
 * @param previousDefinitions The resource definitions before the change.
 * @param nextDefinitions The resource definitions after the change.
 * @param transaction The surrounding app DB transaction, when available.
 */
export async function syncResourceUniqueIndexes(
  appId: number,
  previousDefinitions?: Record<string, ResourceDefinition>,
  nextDefinitions?: Record<string, ResourceDefinition>,
  transaction?: Transaction,
): Promise<void> {
  const { sequelize } = await getAppDB(appId);
  const escapeValue = (value: SqlLiteralValue): string =>
    typeof value === 'boolean' ? String(value) : sequelize.escape(value);
  const previousIndexes = getDesiredResourceUniqueIndexes(escapeValue, previousDefinitions);
  const nextIndexes = getDesiredResourceUniqueIndexes(escapeValue, nextDefinitions);

  for (const [indexName, specification] of nextIndexes) {
    const previousSpecification = previousIndexes.get(indexName);
    const resourceDefinition = nextDefinitions?.[specification.resourceType];

    if (!resourceDefinition) {
      continue;
    }

    if (!previousSpecification) {
      await createResourceUniqueIndex(appId, specification, resourceDefinition, transaction);
      continue;
    }

    if (previousSpecification.expressions.join(',') !== specification.expressions.join(',')) {
      await recreateResourceUniqueIndex(appId, specification, resourceDefinition, transaction);
    }
  }

  for (const indexName of previousIndexes.keys()) {
    if (!nextIndexes.has(indexName)) {
      await dropResourceUniqueIndex(appId, indexName, transaction);
    }
  }
}

/**
 * Check whether one or more resource payloads would violate configured unique
 * constraints before a new constraint is applied or before a caller performs a
 * best-effort batch preflight.
 *
 * This validates both duplicates inside the current payload batch and
 * duplicates against already persisted resources. This is most appropriate when
 * introducing new uniqueness constraints against existing data. It is not a
 * substitute for DB-backed unique index enforcement on normal writes.
 *
 * When the surrounding definition change already runs in an app DB
 * transaction, prefer passing that same transaction here to keep the preflight
 * query aligned with the rest of that operation.
 *
 * @param appId The app whose per-app resource database should be checked.
 * @param resourceType The resource type being written.
 * @param resourceDefinition The resource definition that contains `unique`.
 * @param resources The resource payloads to validate.
 * @param transaction The surrounding app DB transaction, when available.
 * @param excludeResourceId An optional resource id to ignore during updates.
 */
export async function assertResourceUniqueConstraintValues(
  appId: number,
  resourceType: string,
  resourceDefinition: ResourceDefinition,
  resources: Record<string, unknown>[],
  transaction?: Transaction,
  excludeResourceId?: number,
): Promise<void> {
  const { sequelize } = await getAppDB(appId);
  const escapeValue = (value: SqlLiteralValue): string =>
    typeof value === 'boolean' ? String(value) : sequelize.escape(value);
  const seenValues = new Set<string>();

  for (const fields of getUniqueConstraints(resourceDefinition)) {
    const expressions = fields.map((field) =>
      getFieldExpression(escapeValue, resourceType, resourceDefinition, field),
    );

    for (const resource of resources) {
      const values = fields.map((field) => resource[field]);

      if (values.some((value) => value == null)) {
        continue;
      }

      const payloadKey = `${fields.join('\0')}:${JSON.stringify(values)}`;
      if (seenValues.has(payloadKey)) {
        throw new ResourceUniqueConstraintViolationError(resourceType, fields);
      }
      seenValues.add(payloadKey);

      const comparisons = fields.map(
        (field, index) =>
          `${expressions[index]} = ${getFieldValueLiteral(
            escapeValue,
            resourceType,
            resourceDefinition,
            field,
            values[index],
          )}`,
      );

      const [existingResources] = await sequelize.query(
        `
          SELECT id
          FROM "Resource"
          WHERE type = ${escapeValue(resourceType)}
            AND deleted IS NULL
            ${excludeResourceId == null ? '' : `AND id != ${escapeValue(excludeResourceId)}`}
            AND ${comparisons.join(' AND ')}
          LIMIT 1;
        `,
        { transaction },
      );

      if (Array.isArray(existingResources) && existingResources.length) {
        throw new ResourceUniqueConstraintViolationError(resourceType, fields);
      }
    }
  }
}

/**
 * Resolve a generated unique index name back to the resource type and fields it
 * represents.
 *
 * Use this when translating a PostgreSQL unique constraint failure into a
 * resource-specific error message.
 *
 * @param definition The app definition to inspect.
 * @param constraintName The database constraint or index name.
 * @returns The matching resource type and fields, if found.
 */
export function resolveResourceUniqueConstraint(
  definition: AppDefinition | Partial<AppDefinition> | undefined,
  constraintName: string | undefined,
): { fields: string[]; resourceType: string } | undefined {
  if (!definition?.resources || !constraintName) {
    return undefined;
  }

  for (const [resourceType, resourceDefinition] of Object.entries(definition.resources)) {
    for (const fields of getUniqueConstraints(resourceDefinition)) {
      if (getResourceUniqueIndexName(resourceType, fields, resourceDefinition) === constraintName) {
        return { fields, resourceType };
      }
    }
  }

  return undefined;
}

function getConstraintName(error: UniqueConstraintError): string | undefined {
  return (
    (error as UniqueConstraintError & { constraint?: string }).constraint ??
    (error as UniqueConstraintError & { original?: { constraint?: string } }).original
      ?.constraint ??
    (error as UniqueConstraintError & { parent?: { constraint?: string } }).parent?.constraint
  );
}

/**
 * Check whether an unknown error looks like a Sequelize or PostgreSQL unique
 * constraint violation.
 *
 * Use this in broad catch blocks around resource writes or app-definition sync
 * code before attempting to translate the failure into a resource-specific
 * conflict response.
 *
 * @param error The thrown error to inspect.
 * @returns Whether the error appears to represent a unique constraint failure.
 */
export function isUniqueConstraintErrorLike(error: unknown): error is UniqueConstraintError {
  const candidate = error as
    | UniqueConstraintError
    | {
        message?: string;
        name?: string;
        original?: { code?: string; detail?: string };
        parent?: { code?: string; detail?: string };
      };

  const originalCode = getDatabaseErrorField(candidate.original, 'code');
  const parentCode = getDatabaseErrorField(candidate.parent, 'code');
  const originalDetail = getDatabaseErrorField(candidate.original, 'detail');
  const parentDetail = getDatabaseErrorField(candidate.parent, 'detail');

  return (
    error instanceof UniqueConstraintError ||
    candidate.name === 'SequelizeUniqueConstraintError' ||
    originalCode === '23505' ||
    parentCode === '23505' ||
    /duplicate key value violates unique constraint/i.test(candidate.message ?? '') ||
    /duplicate key value violates unique constraint/i.test(originalDetail ?? '') ||
    /duplicate key value violates unique constraint/i.test(parentDetail ?? '')
  );
}

/**
 * Throw a Koa `409` when a DB unique constraint error can be resolved against a
 * full app definition.
 *
 * Use this in app-level flows such as create, patch, or import handlers where a
 * `UniqueConstraintError` may refer to any resource definition in the app.
 *
 * @param ctx The Koa context used to throw the HTTP error.
 * @param definition The app definition used to resolve the constraint name.
 * @param error The unique constraint error thrown by Sequelize/PostgreSQL.
 */
/**
 * Convert a DB unique constraint error into a resource-specific domain error by
 * resolving it against a full app definition.
 *
 * Use this in app-level flows where the failing unique constraint may belong to
 * any resource type in the app, but callers still want to decide themselves how
 * to handle unresolved unique errors.
 *
 * @param definition The app definition used to resolve the constraint name.
 * @param error The unique constraint error thrown by Sequelize/PostgreSQL.
 * @returns A typed resource uniqueness violation error, if it can be resolved.
 */
export function getResourceUniqueConstraintViolationErrorForDefinition(
  definition: AppDefinition | Partial<AppDefinition> | undefined,
  error: UniqueConstraintError,
): ResourceUniqueConstraintViolationError | undefined {
  const violation = resolveResourceUniqueConstraint(definition, getConstraintName(error));

  if (violation) {
    return new ResourceUniqueConstraintViolationError(violation.resourceType, violation.fields);
  }

  return undefined;
}

/**
 * Throw a Koa `409` when a DB unique constraint error can be resolved against a
 * full app definition.
 *
 * Use this in app-level flows such as create, patch, or import handlers where a
 * `UniqueConstraintError` may refer to any resource definition in the app.
 *
 * @param ctx The Koa context used to throw the HTTP error.
 * @param definition The app definition used to resolve the constraint name.
 * @param error The unique constraint error thrown by Sequelize/PostgreSQL.
 */
export function throwResourceUniqueConstraintKoaError(
  ctx: Context,
  definition: AppDefinition | Partial<AppDefinition> | undefined,
  error: UniqueConstraintError,
): never {
  const violationError = getResourceUniqueConstraintViolationErrorForDefinition(definition, error);

  if (violationError) {
    throwKoaError(ctx, 409, violationError.message);
  }

  throw error;
}

/**
 * Convert a DB unique constraint error into a resource-specific domain error.
 *
 * Use this when the caller prefers to throw or map a typed application error
 * itself instead of throwing directly through Koa.
 *
 * @param resourceType The resource type being written.
 * @param resourceDefinition The resource definition for that type.
 * @param error The unique constraint error thrown by Sequelize/PostgreSQL.
 * @returns A typed resource uniqueness violation error, if it can be resolved.
 */
export function getResourceUniqueConstraintViolationError(
  resourceType: string,
  resourceDefinition: ResourceDefinition,
  error: UniqueConstraintError,
): ResourceUniqueConstraintViolationError | undefined {
  const violation = resolveResourceUniqueConstraint(
    { resources: { [resourceType]: resourceDefinition } },
    getConstraintName(error),
  );

  if (violation) {
    return new ResourceUniqueConstraintViolationError(violation.resourceType, violation.fields);
  }

  return undefined;
}

/**
 * Throw a Koa `409` for a unique constraint error in a known single-resource
 * write path.
 *
 * Use this in resource create or update handlers when the resource type and
 * definition are already known, instead of resolving against the full app
 * definition.
 *
 * @param ctx The Koa context used to throw the HTTP error.
 * @param resourceType The resource type being written.
 * @param resourceDefinition The resource definition for that type.
 * @param error The unique constraint error thrown by Sequelize/PostgreSQL.
 */
export function throwResourceUniqueConstraintKoaErrorForResource(
  ctx: Context,
  resourceType: string,
  resourceDefinition: ResourceDefinition,
  error: UniqueConstraintError,
): never {
  const violationError = getResourceUniqueConstraintViolationError(
    resourceType,
    resourceDefinition,
    error,
  );

  if (violationError) {
    throwKoaError(ctx, 409, violationError.message, {
      code: 'RESOURCE_UNIQUE_CONSTRAINT_VIOLATION',
      fields: violationError.fields,
      resourceType: violationError.resourceType,
    });
  }

  throw error;
}
