import { type ResourceDefinition } from '@appsemble/lang-sdk';
import { type Sequelize, type Transaction } from 'sequelize';

export async function syncResourcePositionIndex(
  sequelize: Sequelize,
  appId: number,
  resourceType: string,
  enforceOrderingGroupByFields: string[] = [],
  transaction?: Transaction,
): Promise<void> {
  const orderingFields = enforceOrderingGroupByFields.map(
    (field) => `(data->>${sequelize.escape(field)})`,
  );
  const groupedColumns = ['type', '"Position"', ...orderingFields, '"GroupId"', 'ephemeral'].join(
    ', ',
  );
  const ungroupedColumns = ['type', '"Position"', ...orderingFields, 'ephemeral'].join(', ');

  await sequelize.query(
    `
CREATE UNIQUE INDEX IF NOT EXISTS
"UniquePosition${resourceType}WithGroupIDAppID${appId}"
on "Resource"(${groupedColumns})
WHERE "GroupId" IS NOT NULL AND deleted IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS
"UniquePosition${resourceType}WithNULLGroupIDAppID${appId}"
on "Resource"(${ungroupedColumns})
WHERE "GroupId" IS NULL AND deleted IS NULL;`,
    { transaction },
  );
}

export async function syncResourcePositionIndexes(
  sequelize: Sequelize,
  appId: number,
  resourceDefinitions: Record<string, ResourceDefinition> = {},
  transaction?: Transaction,
): Promise<void> {
  for (const [resourceType, { enforceOrderingGroupByFields, positioning }] of Object.entries(
    resourceDefinitions,
  )) {
    if (positioning) {
      await syncResourcePositionIndex(
        sequelize,
        appId,
        resourceType,
        enforceOrderingGroupByFields ?? [],
        transaction,
      );
    }
  }
}
