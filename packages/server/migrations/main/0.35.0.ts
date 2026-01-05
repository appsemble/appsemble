import { logger } from '@appsemble/node-utils';
import { DataTypes, Op, QueryTypes, type Sequelize, type Transaction } from 'sequelize';

import { getAppDB } from '../../models/index.js';

export const key = '0.35.0';

const BATCH_SIZE = 100;

const appTables = [
  { name: 'AppBlockStyle', orderby: 'block' },
  { name: 'AppInvite', mapUsers: true, orderby: 'email' },
  { name: 'AppMember', mapUsers: true },
  { name: 'AppOAuth2Secret' },
  { name: 'AppSamlSecret' },
  { name: 'AppOAuth2Authorization', through: 'AppMember', orderby: 'sub' },
  { name: 'AppSamlAuthorization', through: 'AppMember', orderby: 'nameId' },
  { name: 'SamlLoginRequest', through: 'AppSamlSecret' },
  { name: 'AppServiceSecret' },
  { name: 'AppSubscription' },
  { name: 'AppVariable' },
  { name: 'AppWebhookSecret' },
  { name: 'OAuth2AuthorizationCode', orderby: 'code' },
  { name: 'Group' },
  { name: 'GroupInvite', through: 'Group', orderby: 'email' },
  { name: 'GroupMember', through: 'Group' },
  { name: 'Resource' },
  { name: 'ResourceSubscription', through: 'Resource' },
  { name: 'ResourceVersion', through: 'Resource' },
  { name: 'Asset' },
];

function serializeValue(value: any): Buffer | Date | string | null {
  if (value == null) {
    return null;
  }
  if (Buffer.isBuffer(value)) {
    return value;
  }
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (typeof value === 'object') {
    return value instanceof Date ? value : JSON.stringify(value);
  }
  return value;
}

async function copyToAppDB(
  mainDB: Sequelize,
  appDB: Sequelize,
  appId: number,
  tableName: string,
  transaction: Transaction,
  appTransaction: Transaction,
  mapUsers = false,
  through?: string,
  orderby = 'id',
): Promise<void> {
  logger.info(`Copying "${tableName}" records from main db to app-${appId} db`);

  let existingAppMemberIds = new Set<string>();
  if (['Asset', 'Resource', 'GroupMember'].includes(tableName)) {
    const [existingAppMembers] = await appDB.query('select "id" from "AppMember"', {
      transaction: appTransaction,
    });

    existingAppMemberIds = new Set((existingAppMembers as { id: string }[]).map((am) => am.id));
  }

  let batchSize = BATCH_SIZE;

  // Some apps have large resources
  if (tableName === 'Resource') {
    batchSize = 10;
  }

  let offset = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Deliberately not selecting "picture" from "AppMember"
    // It's BLOB and causes JavaScript to run out of memory
    const batchQuery = through
      ? `SELECT "${tableName}".* FROM "${tableName}"
       JOIN "${through}" ON "${through}Id" = "${through}"."id"
       WHERE "${through}"."AppId" = :appId
       ORDER BY "${tableName}"."${orderby}"
       OFFSET :offset LIMIT :limit`
      : `SELECT ${tableName === 'AppMember' ? '"id", "role", "email", "emailVerified", "name", "password", "emailKey", "resetKey", "consent", "properties", "scimExternalId", "scimActive", "locale", "timezone", "demo", "created", "updated", "AppId", "UserId"' : '*'} FROM "${tableName}"
       WHERE "AppId" = :appId
       ORDER BY "${orderby}"
       OFFSET :offset LIMIT :limit`;

    const batch = await mainDB.query(batchQuery, {
      replacements: { appId, offset, limit: batchSize },
      type: QueryTypes.SELECT,
      transaction,
    });

    if (batch.length === 0) {
      break;
    }

    let preparedRows = batch as { AppId: number; UserId?: string }[];

    if (tableName === 'Resource') {
      preparedRows = (
        preparedRows as { AppId: number; AuthorId: string | null; EditorId: string | null }[]
      ).map((row) => {
        const preparedRow = row;
        if (row.AuthorId && !existingAppMemberIds.has(row.AuthorId)) {
          logger.warn(
            `Author ${row.AuthorId} is missing from app ${appId} app members. Setting resource AuthorId to NULL`,
          );
          preparedRow.AuthorId = null;
        }
        if (row.EditorId && !existingAppMemberIds.has(row.EditorId)) {
          logger.warn(
            `Editor ${row.EditorId} is missing from app ${appId} app members. Setting resource EditorId to NULL`,
          );
          preparedRow.EditorId = null;
        }
        return preparedRow;
      });
    }

    if (tableName === 'Asset' || tableName === 'GroupMember') {
      preparedRows = (preparedRows as { AppId: number; AppMemberId: string | null }[]).map(
        (row) => {
          const preparedRow = row;
          if (row.AppMemberId && !existingAppMemberIds.has(row.AppMemberId)) {
            logger.warn(
              `AppMember ${row.AppMemberId} is missing from app ${appId} app members. Setting asset AppMemberId to NULL`,
            );
            preparedRow.AppMemberId = null;
          }
          return preparedRow;
        },
      );
    }

    if (tableName === 'GroupMember') {
      preparedRows = (preparedRows as { AppId: number; AppMemberId: string | null }[]).filter(
        (row) => {
          if (row.AppMemberId == null) {
            logger.warn('AppMemberId on GroupMember record cannot be null. Not inserting row');
            return false;
          }
          return true;
        },
      );
    }

    if (Array.isArray(preparedRows) && preparedRows.length > 0) {
      await appDB.getQueryInterface().bulkInsert(
        tableName,
        preparedRows.map(({ AppId, UserId, ...rest }) => {
          const values = Object.fromEntries(
            Object.entries(rest).map(([name, value]) => [name, serializeValue(value)]),
          );
          return {
            ...values,
            ...(mapUsers ? { userId: UserId } : {}),
          };
        }),
        { transaction: appTransaction },
      );
    }

    offset += batchSize;
  }
}

async function deleteFromMainDB(
  mainDB: Sequelize,
  appId: number,
  tableName: string,
  transaction: Transaction,
  through?: string,
): Promise<void> {
  logger.info(`Deleting "${tableName}" records from main db for app ${appId}`);
  const query = through
    ? `DELETE FROM "${tableName}"
       USING "${through}"
       WHERE "${tableName}"."${through}Id" = "${through}"."id"
       AND "${through}"."AppId" = :appId`
    : `DELETE FROM "${tableName}" WHERE "AppId" = :appId`;

  await mainDB.query(query, { replacements: { appId }, transaction });
}

async function copyToMainDB(
  mainDB: Sequelize,
  appDB: Sequelize,
  appId: number,
  tableName: string,
  transaction: Transaction,
  appTransaction: Transaction,
  mapUsers = false,
  through = false,
  orderby = 'id',
): Promise<void> {
  logger.info(`Copying "${tableName}" records from app-${appId} db to main db`);

  let batchSize = BATCH_SIZE;

  // Some apps have large resources
  if (tableName === 'Resource') {
    batchSize = 10;
  }

  let offset = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const batch: { userId?: string }[] = await appDB.query(
      // Deliberately not selecting "picture" from "AppMember"
      // It's BLOB and causes JavaScript to run out of memory
      `SELECT ${tableName === 'AppMember' ? '"id", "role", "email", "emailVerified", "name", "password", "emailKey", "resetKey", "consent", "properties", "scimExternalId", "scimActive", "locale", "timezone", "demo", "created", "updated", "userId"' : '*'} FROM "${tableName}"
       ORDER BY "${orderby}"
       OFFSET :offset LIMIT :limit`,
      {
        replacements: { appId, offset, limit: batchSize },
        type: QueryTypes.SELECT,
        transaction: appTransaction,
      },
    );

    if (batch.length === 0) {
      break;
    }

    if (batch.length > 0) {
      await mainDB.getQueryInterface().bulkInsert(
        tableName,
        batch.map(({ userId, ...rest }) => {
          const values = Object.fromEntries(
            Object.entries(rest).map(([name, value]) => [name, serializeValue(value)]),
          );
          return {
            ...values,
            ...(through ? {} : { AppId: appId }),
            ...(mapUsers ? { UserId: userId } : {}),
          };
        }),
        { transaction },
      );
    }

    offset += batchSize;
  }
}

async function deleteFromAppDB(
  appDB: Sequelize,
  appId: number,
  tableName: string,
  appTransaction: Transaction,
): Promise<void> {
  logger.info(`Deleting "${tableName}" records from app-${appId} db `);
  await appDB.query(`DELETE FROM "${tableName}"`, { transaction: appTransaction });
}

/*
 * Summary:
 * - Create app databases, move data over and drop app tables from main db
 */
export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Migrate app data to app databases');
  const [apps] = await queryInterface.sequelize.query(
    'SELECT "id" FROM "App" WHERE "deleted" IS NULL ORDER BY "id"',
    { transaction },
  );

  for (const app of apps as { id: number }[]) {
    const { sequelize: appDB } = await getAppDB(app.id, db);

    const appTransaction = await appDB.transaction();
    try {
      for (const { mapUsers, name, orderby, through } of appTables) {
        await copyToAppDB(
          db,
          appDB,
          app.id,
          name,
          transaction,
          appTransaction,
          mapUsers,
          through,
          orderby,
        );
      }

      for (const { name, through } of appTables) {
        await deleteFromMainDB(db, app.id, name, transaction, through);
      }

      await appTransaction.commit();
      await appDB.close();
    } catch (error) {
      await appTransaction.rollback();
      await transaction.rollback();
      throw error;
    }
  }

  for (const { name } of appTables.toReversed()) {
    logger.info(`Dropping table ${name} from main database`);
    await queryInterface.dropTable(name, { transaction });
  }
}

/*
 * Summary: Bring app data back into the main db and drop app dbs
 */
export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  await queryInterface.createTable(
    'AppBlockStyle',
    {
      block: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
      style: { type: DataTypes.TEXT },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      AppId: {
        primaryKey: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'App', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'AppInvite',
    {
      email: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
      key: { type: DataTypes.STRING, allowNull: false },
      role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Member' },
      created: { allowNull: false, type: DataTypes.DATE },
      updated: { allowNull: false, type: DataTypes.DATE },
      AppId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: { model: 'App', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      UserId: {
        type: DataTypes.UUID,
        references: { model: 'User', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
    },
    { transaction },
  );
  await queryInterface.addIndex('AppInvite', ['AppId', 'UserId'], {
    name: 'AppInvite_UserId_AppId_key',
    unique: true,
    transaction,
  });
  await queryInterface.createTable(
    'AppMember',
    {
      id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
      role: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false },
      emailVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
      name: { type: DataTypes.STRING },
      password: { type: DataTypes.STRING },
      emailKey: { type: DataTypes.STRING },
      resetKey: { type: DataTypes.STRING },
      consent: { type: DataTypes.DATE },
      picture: { type: DataTypes.BLOB },
      properties: { type: DataTypes.JSON },
      scimExternalId: { type: DataTypes.STRING },
      scimActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      locale: { type: DataTypes.STRING },
      timezone: { type: DataTypes.STRING },
      phoneNumber: { type: DataTypes.STRING },
      demo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      seed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      ephemeral: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      AppId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'App', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      UserId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'User', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
    },
    { transaction },
  );
  await queryInterface.addIndex('AppMember', ['AppId', 'email', 'ephemeral'], {
    name: 'UniqueAppMemberEmailIndex',
    unique: true,
    transaction,
  });
  await queryInterface.addIndex('AppMember', ['AppId', 'phoneNumber'], {
    name: 'UniqueAppMemberPhoneNumberIndex',
    unique: true,
    transaction,
  });
  await queryInterface.addIndex('AppMember', ['AppId', 'UserId'], {
    name: 'UniqueAppMemberIndex',
    unique: true,
    transaction,
  });
  await queryInterface.createTable(
    'AppOAuth2Secret',
    {
      id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      authorizationUrl: { type: DataTypes.STRING, allowNull: false },
      tokenUrl: { type: DataTypes.STRING, allowNull: false },
      userInfoUrl: { type: DataTypes.STRING },
      remapper: { type: DataTypes.JSON },
      clientId: { type: DataTypes.STRING, allowNull: false },
      clientSecret: { type: DataTypes.STRING, allowNull: false },
      icon: { type: DataTypes.STRING, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      scope: { type: DataTypes.STRING, allowNull: false },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      AppId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'App', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'AppOAuth2Authorization',
    {
      sub: { type: DataTypes.STRING, primaryKey: true },
      AppOAuth2SecretId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: { model: 'AppOAuth2Secret', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      accessToken: { type: DataTypes.TEXT, allowNull: false },
      expiresAt: { type: DataTypes.DATE },
      refreshToken: { type: DataTypes.TEXT },
      email: { type: DataTypes.STRING, allowNull: false },
      emailVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      AppMemberId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'AppMember', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'AppSamlSecret',
    {
      id: { autoIncrement: true, type: DataTypes.INTEGER, primaryKey: true },
      idpCertificate: { type: DataTypes.TEXT, allowNull: false },
      entityId: { type: DataTypes.STRING, allowNull: false },
      ssoUrl: { type: DataTypes.STRING, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      icon: { type: DataTypes.STRING, allowNull: false },
      spPrivateKey: { type: DataTypes.TEXT, allowNull: false },
      spPublicKey: { type: DataTypes.TEXT, allowNull: false },
      spCertificate: { type: DataTypes.TEXT, allowNull: false },
      emailAttribute: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
      },
      emailVerifiedAttribute: { type: DataTypes.STRING },
      nameAttribute: { type: DataTypes.STRING },
      objectIdAttribute: { type: DataTypes.STRING },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      AppId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'App', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'AppSamlAuthorization',
    {
      nameId: { type: DataTypes.STRING, primaryKey: true },
      email: { type: DataTypes.STRING, allowNull: false },
      emailVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      AppSamlSecretId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: { model: 'AppSamlSecret', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      AppMemberId: {
        type: DataTypes.UUID,
        references: { model: 'AppMember', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'AppServiceSecret',
    {
      id: { autoIncrement: true, type: DataTypes.INTEGER, primaryKey: true },
      name: { type: DataTypes.STRING },
      urlPatterns: { type: DataTypes.STRING, allowNull: false },
      authenticationMethod: { type: DataTypes.STRING, allowNull: false },
      public: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      identifier: { type: DataTypes.TEXT },
      secret: { type: DataTypes.BLOB },
      tokenUrl: { type: DataTypes.STRING },
      scope: { type: DataTypes.STRING },
      ca: { type: DataTypes.TEXT },
      accessToken: { type: DataTypes.BLOB },
      expiresAt: { type: DataTypes.DATE },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      AppId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'App', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'AppSubscription',
    {
      id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      endpoint: { type: DataTypes.STRING, allowNull: false },
      p256dh: { type: DataTypes.STRING, allowNull: false },
      auth: { type: DataTypes.STRING, allowNull: false },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      AppMemberId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'AppMember', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      AppId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'App', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'AppVariable',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
      value: { type: DataTypes.STRING },
      created: { allowNull: false, type: DataTypes.DATE },
      updated: { allowNull: false, type: DataTypes.DATE },
      AppId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'App', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
    },
    { transaction },
  );
  await queryInterface.addIndex('AppVariable', ['name', 'AppId'], {
    name: 'UniqueNameIndex',
    unique: true,
    transaction,
  });
  await queryInterface.createTable(
    'AppWebhookSecret',
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      name: { type: DataTypes.STRING },
      webhookName: { type: DataTypes.STRING, allowNull: false },
      secret: { type: DataTypes.BLOB, allowNull: false },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      AppId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'App', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'Group',
    {
      id: { autoIncrement: true, type: DataTypes.INTEGER, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      AppId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'App', key: 'id' },
      },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      annotations: { type: DataTypes.JSON },
      demo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'Resource',
    {
      id: { autoIncrement: true, type: DataTypes.INTEGER, primaryKey: true },
      type: { type: DataTypes.STRING, allowNull: false },
      data: { type: DataTypes.JSONB, allowNull: false },
      clonable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      seed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      ephemeral: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      expires: { type: DataTypes.DATE },
      Position: { type: DataTypes.DECIMAL },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      deleted: { type: DataTypes.DATE },
      GroupId: {
        type: DataTypes.INTEGER,
        references: { model: 'Group', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      AuthorId: {
        type: DataTypes.UUID,
        references: { model: 'AppMember', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      EditorId: {
        type: DataTypes.UUID,
        references: { model: 'AppMember', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      AppId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'App', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
    },
    { transaction },
  );
  await queryInterface.addIndex('Resource', ['type', 'expires', 'GroupId', 'AppId'], {
    name: 'resourceTypeComposite',
    transaction,
  });
  await queryInterface.addIndex('Resource', ['data'], {
    name: 'resourceDataIndex',
    using: 'GIN',
    transaction,
  });
  await queryInterface.createTable(
    'Asset',
    {
      id: { type: DataTypes.STRING, primaryKey: true },
      mime: { type: DataTypes.STRING },
      filename: { type: DataTypes.STRING },
      name: { type: DataTypes.STRING },
      clonable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      seed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      ephemeral: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      deleted: { type: DataTypes.DATE },
      ResourceId: {
        type: DataTypes.INTEGER,
        references: { model: 'Resource', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      AppMemberId: {
        type: DataTypes.UUID,
        references: { model: 'AppMember', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      GroupId: {
        type: DataTypes.INTEGER,
        references: { model: 'Group', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      AppId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'App', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
    },
    { transaction },
  );
  await queryInterface.addIndex('Asset', ['name'], {
    name: 'assetNameIndex',
    transaction,
  });
  await queryInterface.addIndex('Asset', ['AppId'], {
    name: 'assetAppIdIndex',
    transaction,
  });
  await queryInterface.addIndex('Asset', ['name', 'AppId'], {
    name: 'assetAppIdNameIndex',
    transaction,
  });
  await queryInterface.addIndex('Asset', ['name', 'ephemeral', 'GroupId', 'AppId'], {
    name: 'UniqueAssetWithGroupId',
    unique: true,
    where: { GroupId: { [Op.not]: null }, deleted: { [Op.is]: null } },
    transaction,
  });
  await queryInterface.addIndex('Asset', ['name', 'ephemeral', 'AppId'], {
    name: 'UniqueAssetWithNullGroupId',
    unique: true,
    where: { GroupId: null, deleted: { [Op.is]: null } },
    transaction,
  });
  await queryInterface.createTable(
    'GroupInvite',
    {
      GroupId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'Group', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      email: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
      key: { type: DataTypes.STRING, allowNull: false },
      role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Member' },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'GroupMember',
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      role: { type: DataTypes.STRING, allowNull: false },
      GroupId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: { model: 'Group', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      AppMemberId: {
        type: DataTypes.UUID,
        primaryKey: true,
        references: { model: 'AppMember', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'OAuth2AuthorizationCode',
    {
      code: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
      redirectUri: { type: DataTypes.STRING, allowNull: false },
      expires: { type: DataTypes.DATE, allowNull: false },
      scope: { type: DataTypes.STRING, allowNull: false },
      AppMemberId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'AppMember', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      AppId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'App', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'ResourceSubscription',
    {
      id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      ResourceId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Resource', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      action: { type: DataTypes.STRING },
      type: { type: DataTypes.STRING },
      AppSubscriptionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'AppSubscription', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'ResourceVersion',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4(),
      },
      data: { type: DataTypes.JSON },
      ResourceId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Resource', key: 'id' },
      },
      AppMemberId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.UUID,
        references: { model: 'AppMember', key: 'id' },
      },
      created: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.createTable(
    'SamlLoginRequest',
    {
      id: { type: DataTypes.STRING, primaryKey: true },
      scope: { type: DataTypes.STRING, allowNull: false },
      state: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING },
      nameId: { type: DataTypes.STRING },
      redirectUri: { type: DataTypes.STRING, allowNull: false },
      timezone: { type: DataTypes.STRING, allowNull: false },
      AppSamlSecretId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'AppSamlSecret', key: 'id' },
      },
      AppMemberId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'AppMember', key: 'id' },
      },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );

  const [apps] = await queryInterface.sequelize.query(
    'SELECT "id" FROM "App" WHERE "deleted" IS NULL ORDER BY "id"',
    {
      transaction,
    },
  );

  for (const app of apps as { id: number }[]) {
    const { sequelize: appDB } = await getAppDB(app.id, db);

    const appTransaction = await appDB.transaction();
    try {
      for (const { mapUsers, name, orderby, through } of appTables) {
        await copyToMainDB(
          db,
          appDB,
          app.id,
          name,
          transaction,
          appTransaction,
          mapUsers,
          Boolean(through),
          orderby,
        );
      }

      for (const { name } of appTables.toReversed()) {
        await deleteFromAppDB(appDB, app.id, name, appTransaction);
      }

      await appTransaction.commit();
      await appDB.close();
    } catch (error) {
      await appTransaction.rollback();
      await transaction.rollback();
      throw error;
    }
  }
}
