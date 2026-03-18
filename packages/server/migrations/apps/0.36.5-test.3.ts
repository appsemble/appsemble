import { logger } from '@appsemble/node-utils';
import { type Sequelize, type Transaction } from 'sequelize';

export const key = '0.36.5-test.3';

/**
 * Summary:
 * - Backfill missing `AppMemberAssignedRole` rows from the legacy `AppMember.role` shim.
 * - Keep legacy `AppMember.role` inserts and updates synchronized with `AppMemberAssignedRole`.
 *
 * @param transaction Sequelize transaction
 * @param db The Sequelize Database.
 */
export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  logger.info(
    'Backfilling missing `AppMemberAssignedRole` rows from compatibility `AppMember.role`',
  );
  await db.query(
    `
      INSERT INTO "AppMemberAssignedRole" ("AppMemberId", role, source, created, updated)
      SELECT id, role, 'manual', created, updated
      FROM "AppMember"
      WHERE role IS NOT NULL
      ON CONFLICT ("AppMemberId", role) DO NOTHING
    `,
    { transaction },
  );

  logger.info('Recreating legacy role compatibility trigger');
  await db.query(
    'DROP TRIGGER IF EXISTS "syncAppMemberAssignedRoleFromLegacyRole" ON "AppMember"',
    { transaction },
  );
  await db.query('DROP FUNCTION IF EXISTS "syncAppMemberAssignedRoleFromLegacyRole"()', {
    transaction,
  });

  await db.query(
    `
      CREATE FUNCTION "syncAppMemberAssignedRoleFromLegacyRole"()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      AS $$
      BEGIN
        DELETE FROM "AppMemberAssignedRole"
        WHERE "AppMemberId" = NEW.id
          AND source = 'manual';

        IF NEW.role IS NOT NULL THEN
          INSERT INTO "AppMemberAssignedRole" ("AppMemberId", role, source, created, updated)
          VALUES (
            NEW.id,
            NEW.role,
            'manual',
            COALESCE(NEW.created, NOW()),
            COALESCE(NEW.updated, NOW())
          )
          ON CONFLICT ("AppMemberId", role)
          DO UPDATE SET updated = EXCLUDED.updated;
        END IF;

        RETURN NEW;
      END;
      $$
    `,
    { transaction },
  );

  await db.query(
    `
      CREATE TRIGGER "syncAppMemberAssignedRoleFromLegacyRole"
      AFTER INSERT OR UPDATE OF role ON "AppMember"
      FOR EACH ROW
      EXECUTE FUNCTION "syncAppMemberAssignedRoleFromLegacyRole"()
    `,
    { transaction },
  );
}

/**
 * Summary:
 * - Remove the legacy role compatibility trigger.
 *
 * @param transaction Sequelize transaction
 * @param db The Sequelize Database.
 */
export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  logger.info('Dropping legacy role compatibility trigger');
  await db.query(
    'DROP TRIGGER IF EXISTS "syncAppMemberAssignedRoleFromLegacyRole" ON "AppMember"',
    { transaction },
  );
  await db.query('DROP FUNCTION IF EXISTS "syncAppMemberAssignedRoleFromLegacyRole"()', {
    transaction,
  });
}
