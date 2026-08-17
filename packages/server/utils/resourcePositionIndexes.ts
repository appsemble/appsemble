import { createHash } from 'node:crypto';

import { normalize, type ResourceDefinition } from '@appsemble/lang-sdk';
import { QueryTypes, type Sequelize, type Transaction } from 'sequelize';

import { resourcePartitionName } from './resourcePartition.js';

const indexPrefix = 'UniquePosition_';

/**
 * Build a deterministic name for a resource position index.
 *
 * The ordering fields are part of the hash, so a definition change yields a different name. That
 * keeps `CREATE UNIQUE INDEX IF NOT EXISTS` honest: an index whose columns no longer match the
 * definition can never be mistaken for the desired one, and is dropped as stale instead.
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
    .update(`${resourceType}:${enforceOrderingGroupByFields.join('\0')}:${scope}`)
    .digest('hex')
    .slice(0, 16);
  const normalizedType = normalize(resourceType).replaceAll('-', '_').slice(0, 20) || 'resource';

  return `${indexPrefix}${normalizedType}_${hash}_${scope}`;
}

export async function syncResourcePositionIndex(
  sequelize: Sequelize,
  resourceType: string,
  enforceOrderingGroupByFields: string[] = [],
  transaction?: Transaction,
): Promise<void> {
  const orderingFields = enforceOrderingGroupByFields.map(
    (field) => `(data->>${sequelize.escape(field)})`,
  );
  const groupedColumns = ['"Position"', ...orderingFields, '"GroupId"', 'ephemeral'].join(', ');
  const ungroupedColumns = ['"Position"', ...orderingFields, 'ephemeral'].join(', ');
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

  for (const [resourceType, { enforceOrderingGroupByFields, positioning }] of Object.entries(
    resourceDefinitions,
  )) {
    if (positioning) {
      const orderingFields = enforceOrderingGroupByFields ?? [];
      desiredIndexes.add(getResourcePositionIndexName(resourceType, orderingFields, 'grouped'));
      desiredIndexes.add(getResourcePositionIndexName(resourceType, orderingFields, 'ungrouped'));
      await syncResourcePositionIndex(sequelize, resourceType, orderingFields, transaction);
    }
  }

  const existingIndexes = await sequelize.query<{ indexname: string }>(
    `SELECT indexname FROM pg_indexes WHERE indexname LIKE 'UniquePosition%'`,
    { type: QueryTypes.SELECT, transaction },
  );

  for (const { indexname } of existingIndexes) {
    if (!desiredIndexes.has(indexname)) {
      await sequelize.query(`DROP INDEX IF EXISTS "${indexname}"`, { transaction });
    }
  }
}
