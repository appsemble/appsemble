import { DataTypes, type Sequelize } from 'sequelize';

export const key = '0.22.6';

/**
 * Summary:
 * - Create a `AppCollection` table
 * - Create a `AppCollectionApp` table
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  await queryInterface.createTable('AppCollection', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    headerImage: { type: DataTypes.BLOB, allowNull: false },
    headerImageMimeType: { type: DataTypes.STRING, allowNull: false },
    expertName: { type: DataTypes.STRING, allowNull: false },
    expertDescription: { type: DataTypes.STRING(4000) },
    expertProfileImage: { type: DataTypes.BLOB, allowNull: false },
    expertProfileImageMimeType: { type: DataTypes.STRING, allowNull: false },
    OrganizationId: {
      type: DataTypes.STRING,
      references: {
        model: 'Organization',
        key: 'id',
      },
      allowNull: false,
    },
    visibility: { type: DataTypes.STRING, allowNull: false },
    created: { allowNull: false, type: DataTypes.DATE },
    updated: { allowNull: false, type: DataTypes.DATE },
  });
  await queryInterface.createTable('AppCollectionApp', {
    id: { type: DataTypes.INTEGER, autoIncrement: true },
    AppCollectionId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'AppCollection',
        key: 'id',
      },
      onDelete: 'CASCADE',
      unique: 'UniqueAppCollectionAppIndex',
    },
    AppId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'App',
        key: 'id',
      },
      unique: 'UniqueAppCollectionAppIndex',
    },
    created: { allowNull: false, type: DataTypes.DATE },
    updated: { allowNull: false, type: DataTypes.DATE },
  });
  await queryInterface.addConstraint('AppCollectionApp', {
    name: 'UniqueAppCollectionAppIndex',
    fields: ['AppCollectionId', 'AppId'],
    type: 'unique',
  });
}

/**
 * Summary:
 * - Drop `AppCollection` table
 * - Drop `AppCollectionApp` table
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  await queryInterface.dropTable('AppCollectionApp');
  await queryInterface.dropTable('AppCollection');
}
