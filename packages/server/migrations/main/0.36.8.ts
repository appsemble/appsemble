import { logger } from '@appsemble/node-utils';
import { type Sequelize, type Transaction } from 'sequelize';

export const key = '0.36.8';

/**
 * Summary:
 * - Normalize `AppCollection.domain` values to lowercase and trim whitespace
 * - Clear duplicate `AppCollection.domain` values, keeping the most recently updated row
 * - Replace index `appCollectionComposite` with unique index `UniqueAppCollectionDomain`
 *
 * @param transaction The sequelize Transaction.
 * @param db The sequelize database.
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Normalize `domain` values in `AppCollection` table');
  await queryInterface.sequelize.query(
    `
      UPDATE "AppCollection"
      SET "domain" = NULLIF(lower(btrim("domain")), '')
      WHERE "domain" IS NOT NULL;
    `,
    { transaction },
  );

  logger.info('Clear duplicate `domain` values in `AppCollection` table');
  await queryInterface.sequelize.query(
    `
      UPDATE "AppCollection" ac
      SET "domain" = NULL
      FROM (
        SELECT
          "id",
          ROW_NUMBER() OVER (
            PARTITION BY "domain"
            ORDER BY "updated" DESC, "id" DESC
          ) AS rn
        FROM "AppCollection"
        WHERE "domain" IS NOT NULL
      ) ranked
      WHERE ac."id" = ranked."id" AND ranked.rn > 1;
    `,
    { transaction },
  );

  logger.info('Remove index `appCollectionComposite` from `AppCollection` table');
  await queryInterface.removeIndex('AppCollection', 'appCollectionComposite', { transaction });

  logger.info('Add index `UniqueAppCollectionDomain` to `AppCollection` table');
  await queryInterface.sequelize.query(
    `
      CREATE UNIQUE INDEX "UniqueAppCollectionDomain"
      ON "AppCollection" ("domain")
      WHERE "domain" IS NOT NULL;
    `,
    { transaction },
  );
}

/**
 * Summary:
 * - Replace index `UniqueAppCollectionDomain` with non-unique index `appCollectionComposite`
 *
 * @param transaction The sequelize Transaction.
 * @param db The sequelize database.
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Remove index `UniqueAppCollectionDomain` from `AppCollection` table');
  await queryInterface.removeIndex('AppCollection', 'UniqueAppCollectionDomain', { transaction });

  logger.info('Add index `appCollectionComposite` to `AppCollection` table');
  await queryInterface.addIndex('AppCollection', {
    name: 'appCollectionComposite',
    fields: ['domain', { name: 'updated', order: 'DESC' }],
    transaction,
  });
}
