import { createHash } from 'node:crypto';

import { normalize, type ResourceDefinition } from '@appsemble/lang-sdk';
import { QueryTypes, type Sequelize, type Transaction } from 'sequelize';

import { resourcePartitionName } from './resourcePartition.js';

const indexPrefix = 'UniquePosition_';

/**
 * Marker for the expression form the indexes are built with.
 *
 * It is part of the index name hash, so changing how ordering fields are expressed renames the
 * indexes, and `syncResourcePositionIndexes` drops the ones built with the previous form.
 */
const expressionVersion = 'jsonb-null-seed';

/**
 * Check whether a database constraint name belongs to a resource position index.
 *
 * @param constraintName The constraint name reported by PostgreSQL.
 * @returns Whether the constraint is one of the position indexes.
 */
export function isResourcePositionIndexName(constraintName: string | undefined): boolean {
  return Boolean(constraintName?.startsWith(indexPrefix));
}

/**
 * Build a deterministic name for a resource position index.
 *
 * The ordering fields and the expression form are part of the hash, so a definition change or a
 * change to how the fields are expressed yields a different name. That keeps
 * `CREATE UNIQUE INDEX IF NOT EXISTS` honest: an index whose columns no longer match the definition
 * can never be mistaken for the desired one, and is dropped as stale instead.
 *
 * @param resourceType The resource type the index belongs to.
 * @param enforceOrderingGroupByFields The fields the type's positions are scoped by.
 * @param scope Whether the index covers grouped or ungrouped resources.
 * @returns A stable index name derived from the resource type, ordering fields, and scope.
 */
export function getResourcePositionIndexName(
  resourceType: string,
  enforceOrderingGroupByFields: string[],
  scope: 'grouped' | 'ungrouped',
): string {
  const hash = createHash('sha1')
    .update(
      `${resourceType}:${enforceOrderingGroupByFields.join('\0')}:${scope}:${expressionVersion}`,
    )
    .digest('hex')
    .slice(0, 16);
  const normalizedType = normalize(resourceType).replaceAll('-', '_').slice(0, 20) || 'resource';

  return `${indexPrefix}${normalizedType}_${hash}_${scope}`;
}

/**
 * Build the SQL expressions the ordering group is keyed by.
 *
 * COALESCE to JSON null rather than `->>` text: a missing key and a JSON null are the same ordering
 * group to the app, but SQL NULLs are distinct to a unique index, so the text form lets two
 * resources in that group share a position. Comparing jsonb keeps the string `"null"` separate from
 * JSON null, and works on PostgreSQL 14, unlike NULLS NOT DISTINCT.
 *
 * @param sequelize The app database connection, used to escape the field names.
 * @param enforceOrderingGroupByFields The fields the type's positions are scoped by.
 * @returns One SQL expression per ordering field.
 */
function getOrderingGroupExpressions(
  sequelize: Sequelize,
  enforceOrderingGroupByFields: string[],
): string[] {
  return enforceOrderingGroupByFields.map(
    (field) => `(COALESCE(data->${sequelize.escape(field)}, 'null'::jsonb))`,
  );
}

/**
 * Renumber the positions of ordering groups that hold duplicates.
 *
 * Position uniqueness was not enforced before, so an app database can hold groups where several
 * resources share a position, which would make the unique index impossible to create. Only groups
 * that actually contain a duplicate are touched, and their existing order is preserved, so the only
 * resources whose relative order can change are the ones that were already ambiguous.
 *
 * Window `PARTITION BY` treats NULLs as equal, matching how the app groups resources.
 *
 * @param sequelize The app database connection.
 * @param resourceType The resource type to renumber.
 * @param orderingExpressions The expressions the ordering group is keyed by.
 * @param transaction The surrounding app DB transaction, when available.
 */
async function rebalanceDuplicateResourcePositions(
  sequelize: Sequelize,
  resourceType: string,
  orderingExpressions: string[],
  transaction?: Transaction,
): Promise<void> {
  const partition = resourcePartitionName(resourceType);
  const orderingAliases = orderingExpressions.map((unused, index) => `"orderingGroup${index}"`);
  const scopedColumns = ['"GroupId"', 'ephemeral', 'seed', ...orderingAliases].join(', ');
  const projectedOrdering = orderingExpressions
    .map((expression, index) => `${expression} AS ${orderingAliases[index]}`)
    .join(', ');
  const groupColumns = ['"GroupId"', 'ephemeral', 'seed', ...orderingExpressions].join(', ');

  await sequelize.query(
    `
UPDATE "${partition}" AS resource
SET "Position" = renumbered."Position"
FROM (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY ${scopedColumns}
      ORDER BY "Position" ASC, updated DESC, id ASC
    ) * 10 AS "Position",
    MAX(duplicates) OVER (PARTITION BY ${scopedColumns}) AS "groupDuplicates"
  FROM (
    SELECT
      id,
      "Position",
      updated,
      "GroupId",
      ephemeral,
      seed,
      ${projectedOrdering ? `${projectedOrdering},` : ''}
      COUNT(*) OVER (PARTITION BY ${groupColumns}, "Position") AS duplicates
    FROM "${partition}"
    WHERE deleted IS NULL AND "Position" IS NOT NULL
  ) AS scoped
) AS renumbered
WHERE resource.id = renumbered.id
  AND renumbered."groupDuplicates" > 1
  AND resource."Position" IS DISTINCT FROM renumbered."Position";`,
    { transaction },
  );
}

export async function syncResourcePositionIndex(
  sequelize: Sequelize,
  resourceType: string,
  enforceOrderingGroupByFields: string[] = [],
  transaction?: Transaction,
): Promise<void> {
  const orderingFields = getOrderingGroupExpressions(sequelize, enforceOrderingGroupByFields);

  await rebalanceDuplicateResourcePositions(sequelize, resourceType, orderingFields, transaction);

  // The seed flag is part of the key because seed resources are numbered independently of the
  // resources an app member creates: a seeded list and a live list each start at the first
  // position.
  const groupedColumns = ['"Position"', ...orderingFields, '"GroupId"', 'ephemeral', 'seed'].join(
    ', ',
  );
  const ungroupedColumns = ['"Position"', ...orderingFields, 'ephemeral', 'seed'].join(', ');
  // On the type's own partition rather than on "Resource": an index on the partitioned parent
  // applies to the rows of every type, so the narrowest ordering group in the app would decide
  // which positions all other types may use.
  const partition = resourcePartitionName(resourceType);

  await sequelize.query(
    `
CREATE UNIQUE INDEX IF NOT EXISTS
"${getResourcePositionIndexName(resourceType, enforceOrderingGroupByFields, 'grouped')}"
on "${partition}"(${groupedColumns})
WHERE "GroupId" IS NOT NULL AND deleted IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS
"${getResourcePositionIndexName(resourceType, enforceOrderingGroupByFields, 'ungrouped')}"
on "${partition}"(${ungroupedColumns})
WHERE "GroupId" IS NULL AND deleted IS NULL;`,
    { transaction },
  );
}

/**
 * Synchronize DB position indexes for the resource definitions of an app.
 *
 * Creates the indexes the definitions call for and drops every other position index, so a type that
 * changed its ordering fields, stopped using positioning, or was removed does not keep enforcing
 * uniqueness on a stale set of columns.
 *
 * @param sequelize The app database connection.
 * @param resourceDefinitions The resource definitions to synchronize against.
 * @param transaction The surrounding app DB transaction, when available.
 */
export async function syncResourcePositionIndexes(
  sequelize: Sequelize,
  resourceDefinitions: Record<string, ResourceDefinition> = {},
  transaction?: Transaction,
): Promise<void> {
  const desiredIndexes = new Set<string>();
  const positionedTypes: [string, string[]][] = [];

  for (const [resourceType, { enforceOrderingGroupByFields, positioning }] of Object.entries(
    resourceDefinitions,
  )) {
    if (positioning) {
      const orderingFields = enforceOrderingGroupByFields ?? [];
      desiredIndexes.add(getResourcePositionIndexName(resourceType, orderingFields, 'grouped'));
      desiredIndexes.add(getResourcePositionIndexName(resourceType, orderingFields, 'ungrouped'));
      positionedTypes.push([resourceType, orderingFields]);
    }
  }

  const existingIndexes = await sequelize.query<{ indexname: string }>(
    `SELECT indexname FROM pg_indexes WHERE indexname LIKE 'UniquePosition%'`,
    { type: QueryTypes.SELECT, transaction },
  );

  // Stale indexes go first: creating an index renumbers duplicate positions, and an index built on
  // a previous set of ordering fields would reject the rows on the way to the renumbered state.
  for (const { indexname } of existingIndexes) {
    if (!desiredIndexes.has(indexname)) {
      await sequelize.query(`DROP INDEX IF EXISTS "${indexname}"`, { transaction });
    }
  }

  for (const [resourceType, orderingFields] of positionedTypes) {
    await syncResourcePositionIndex(sequelize, resourceType, orderingFields, transaction);
  }
}
