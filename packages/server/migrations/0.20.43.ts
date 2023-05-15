import { DataTypes, type Sequelize } from 'sequelize';

export const key = '0.20.43';

/**
 * Summary:
 * - Create a `AppServiceSecret` table
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  await queryInterface.createTable('AppServiceSecret', {
    id: { type: DataTypes.INTEGER, autoIncrement: true },
    serviceName: { type: DataTypes.STRING },
    urlPatterns: { type: DataTypes.STRING, allowNull: false },
    authenticationMethod: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    identifier: { type: DataTypes.TEXT },
    secret: { type: DataTypes.BLOB },
    tokenUrl: { type: DataTypes.STRING },
    accessToken: { type: DataTypes.BLOB },
    expiresAt: { type: DataTypes.DATE },
    AppId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'App',
        key: 'id',
      },
    },
    created: { allowNull: false, type: DataTypes.DATE },
    updated: { allowNull: false, type: DataTypes.DATE },
  });
}

/**
 * Summary:
 * - Drop `AppServiceSecret` table
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  await queryInterface.dropTable('AppServiceSecret');
}
