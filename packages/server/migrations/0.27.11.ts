import { logger } from '@appsemble/node-utils';
import { type Sequelize } from 'sequelize';

export const key = '0.27.11';

/**
 * Summary:
 * - Change `AppOAuth2Authorization_AppOAuth2SecretId_fkey` foreign key constraint to cascade.
 * - Change `AppSamlAuthorization_AppSamlSecretId_fkey` foreign key constraint to cascade.
 * - Change `SamlLoginRequest_AppSamlSecretId_fkey` foreign key constraint to cascade.
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  const tables = [
    {
      tableName: 'AppOAuth2Authorization',
      field: 'AppOAuth2SecretId',
      foreignKeyName: 'AppOAuth2Authorization_AppOAuth2SecretId_fkey',
      referencedTableName: 'AppOAuth2Secret',
    },
    {
      tableName: 'AppSamlAuthorization',
      field: 'AppSamlSecretId',
      foreignKeyName: 'AppSamlAuthorization_AppSamlSecretId_fkey',
      referencedTableName: 'AppSamlSecret',
    },
    {
      tableName: 'SamlLoginRequest',
      field: 'AppSamlSecretId',
      foreignKeyName: 'SamlLoginRequest_AppSamlSecretId_fkey',
      referencedTableName: 'AppSamlSecret',
    },
  ];

  for (const { field, foreignKeyName, referencedTableName, tableName } of tables) {
    logger.info(
      `Removing foreign key constraint \`${foreignKeyName}\` from table \`${tableName}\``,
    );
    await queryInterface.removeConstraint(tableName, foreignKeyName);

    logger.info(
      `Adding foreign key constraint \`${foreignKeyName}\` to table \`${tableName}\` without cascade`,
    );
    await queryInterface.addConstraint(tableName, {
      fields: [field],
      type: 'foreign key',
      name: foreignKeyName,
      onUpdate: 'cascade',
      onDelete: 'cascade',
      references: {
        table: referencedTableName,
        field: 'id',
      },
    });
  }
}

/**
 * Summary:
 * - Change `AppOAuth2Authorization_AppOAuth2SecretId_fkey` foreign key constraint to not cascade.
 * - Change `AppSamlAuthorization_AppSamlSecretId_fkey` foreign key constraint to not cascade.
 * - Change `SamlLoginRequest_AppSamlSecretId_fkey` foreign key constraint to not cascade.
 *
 * @param db The sequelize Database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  const tables = [
    {
      tableName: 'AppOAuth2Authorization',
      field: 'AppOAuth2SecretId',
      foreignKeyName: 'AppOAuth2Authorization_AppOAuth2SecretId_fkey',
      referencedTableName: 'AppOAuth2Secret',
    },
    {
      tableName: 'AppSamlAuthorization',
      field: 'AppSamlSecretId',
      foreignKeyName: 'AppSamlAuthorization_AppSamlSecretId_fkey',
      referencedTableName: 'AppSamlSecret',
    },
    {
      tableName: 'SamlLoginRequest',
      field: 'AppSamlSecretId',
      foreignKeyName: 'SamlLoginRequest_AppSamlSecretId_fkey',
      referencedTableName: 'AppSamlSecret',
    },
  ];

  for (const { field, foreignKeyName, referencedTableName, tableName } of tables) {
    logger.info(
      `Removing foreign key constraint \`${foreignKeyName}\` from table \`${tableName}\``,
    );
    await queryInterface.removeConstraint(tableName, foreignKeyName);

    logger.info(
      `Adding foreign key constraint \`${foreignKeyName}\` to table \`${tableName}\` without cascade`,
    );
    await queryInterface.addConstraint(tableName, {
      fields: [field],
      type: 'foreign key',
      name: foreignKeyName,
      onUpdate: 'set null',
      onDelete: 'set null',
      references: {
        table: referencedTableName,
        field: 'id',
      },
    });
  }
}
