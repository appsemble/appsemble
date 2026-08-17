import { type ResourceDefinition } from '@appsemble/lang-sdk';
import { type Sequelize, type Transaction } from 'sequelize';

import { syncResourcePositionIndexes } from './resourcePositionIndexes.js';
import { syncResourceUniqueIndexes } from './resourceUniqueIndexes.js';

export async function syncAppDefinitionIndexes({
  previousResources,
  resources,
  sequelize,
  transaction,
}: {
  previousResources?: Record<string, ResourceDefinition>;
  resources?: Record<string, ResourceDefinition>;
  sequelize: Sequelize;
  transaction?: Transaction;
}): Promise<void> {
  await syncResourceUniqueIndexes(sequelize, previousResources, resources, transaction);
  await syncResourcePositionIndexes(sequelize, resources, transaction);
}
