import { type Transaction } from 'sequelize';

import { getAppDB } from '../models/index.js';

export async function createDynamicIndexes(
  enforceOrderingGroupByFields: string[],
  appId: number,
  resourceType: string,
  transaction?: Transaction,
): Promise<void> {
  const { sequelize } = await getAppDB(appId);
  const queries = enforceOrderingGroupByFields
    .map(
      (field) => `
CREATE UNIQUE INDEX IF NOT EXISTS
"UniquePosition${resourceType}${field}WithGroupID"
on "Resource"(type, "Position", (data->>'${field}'), "GroupId", ephemeral)
WHERE "GroupId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS
"UniquePosition${resourceType}${field}WithNULLGroupID"
on "Resource"(type, "Position", (data->>'${field}'), ephemeral)
WHERE "GroupId" IS NULL;
`,
    )
    .join('\n');
  await sequelize.query(queries, { transaction });
}
