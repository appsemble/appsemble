import { logger } from '@appsemble/node-utils';
import { Sequelize } from 'sequelize';

export const key = '0.18.11';

/**
 * Summary:
 * - Add enum options "APIUser", "APIReader", "Translator"
 *
 * @param db - The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  logger.info('Adding enum value "APIUser" to "enum_Member_role"');
  await db.query("ALTER TYPE \"enum_Member_role\" ADD VALUE 'APIUser' AFTER 'Member'");

  logger.info('Adding enum value "APIReader" to "enum_Member_role"');
  await db.query("ALTER TYPE \"enum_Member_role\" ADD VALUE 'APIReader' AFTER 'Member'");

  logger.info('Adding enum value "Translator" to "enum_Member_role"');
  await db.query("ALTER TYPE \"enum_Member_role\" ADD VALUE 'Translator' AFTER 'Member'");
}

/**
 * Summary:
 * - Remove enum options "APIUser", "APIReader", "Translator"
 *
 * @param db - The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  logger.info('Setting role of all APIUsers, APIReaders, and Translators to Member');
  await db.query(
    "UPDATE \"Member\" SET role = 'Member' WHERE role IN ('APIUser', 'APIReader', 'Translator')",
  );

  logger.info('Removing enum value "APIUser" from "enum_Member_role"');
  await db.query("ALTER TYPE \"enum_Member_role\" ADD VALUE 'APIUser' AFTER 'member'");

  logger.info('Removing enum value "APIReader" from "enum_Member_role"');
  await db.query("ALTER TYPE \"enum_Member_role\" ADD VALUE 'APIReader' AFTER 'member'");

  logger.info('Removing enum value "Translator" from "enum_Member_role"');
  await db.query("ALTER TYPE \"enum_Member_role\" ADD VALUE 'Translator' AFTER 'member'");
}
