import { type Transaction } from 'sequelize';

import { getAppDB } from '../models/index.js';

export async function createDynamicIndexes(
  enforceOrderingGroupByFields: string[],
  appId: number,
  resourceType: string,
  transaction?: Transaction,
): Promise<void> {
  const { sequelize } = await getAppDB(appId);
  const orderingFields = enforceOrderingGroupByFields
    .map((field) => `(data->>'${field}')`)
    .join(', ');
  const queries = [
    `
CREATE UNIQUE INDEX IF NOT EXISTS
"UniquePosition${resourceType}WithGroupIDAppID${appId}"
on "Resource"(type, "Position", ${orderingFields}, "GroupId", ephemeral, deleted)
WHERE "GroupId" IS NOT NULL;`,
    `
CREATE UNIQUE INDEX IF NOT EXISTS
"UniquePosition${resourceType}WithNULLGroupIDAppID${appId}"
on "Resource"(type, "Position", ${orderingFields}, ephemeral, deleted)
WHERE "GroupId" IS NULL;`,
  ].join('\n');
  await sequelize.query(queries, { transaction });
}
