import { type Transaction } from 'sequelize';

import { getDB } from '../models/index.js';

export async function createDynamicIndexes(
  enforceOrderingGroupByFields: string[],
  appId: number,
  resourceType: string,
  transaction?: Transaction,
): Promise<void> {
  const db = getDB();
  const queries = enforceOrderingGroupByFields
    .map(
      (field) => `
CREATE UNIQUE INDEX IF NOT EXISTS
"UniquePosition${resourceType}${field}WithGroupIDAppID${appId}"
on "Resource"(type, "AppId", "Position", (data->>'${field}'), "GroupId", ephemeral)
WHERE "GroupId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS
"UniquePosition${resourceType}${field}WithNULLGroupIDAppID${appId}"
on "Resource"(type, "AppId", "Position", (data->>'${field}'), ephemeral)
WHERE "GroupId" IS NULL;
`,
    )
    .join('\n');
  await db.query(queries, { transaction });
}
