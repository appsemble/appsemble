import { type Transaction } from 'sequelize';

import { getDB } from '../models/index.js';

export async function createDynamicIndexes(
  enforceOrderingGroupByFields: string[],
  appId: number,
  resourceType: string,
  transaction?: Transaction,
): Promise<void> {
  const db = getDB();
  const orderingFields = enforceOrderingGroupByFields
    .map((field) => `(data->>'${field}')`)
    .join(', ');
  const queries = [
    `
CREATE UNIQUE INDEX IF NOT EXISTS
"UniquePosition${resourceType}WithGroupIDAppID${appId}"
on "Resource"(type, "AppId", "Position", ${orderingFields}, "GroupId", ephemeral, deleted)
WHERE "GroupId" IS NOT NULL;`,
    `
CREATE UNIQUE INDEX IF NOT EXISTS
"UniquePosition${resourceType}WithNULLGroupIDAppID${appId}"
on "Resource"(type, "AppId", "Position", ${orderingFields}, ephemeral, deleted)
WHERE "GroupId" IS NULL;`,
  ].join('\n');
  await db.query(queries, { transaction });
}
