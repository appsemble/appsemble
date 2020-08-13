import { DataTypes, Sequelize } from 'sequelize';

export const key = '0.9.4';

export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  await queryInterface.addColumn('App', 'template', {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  });

  await queryInterface.createTable('AppRating', {
    rating: { type: DataTypes.INTEGER, allowNull: false },
    description: { type: DataTypes.TEXT },
    AppId: {
      primaryKey: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: 'UniqueRatingIndex',
      references: {
        model: 'App',
        key: 'id',
      },
    },
    UserId: {
      primaryKey: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: 'UniqueRatingIndex',
      references: {
        model: 'User',
        key: 'id',
      },
    },
    created: { allowNull: false, type: DataTypes.DATE },
    updated: { allowNull: false, type: DataTypes.DATE },
  });
}

export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  await queryInterface.removeColumn('App', 'template');
  await queryInterface.dropTable('AppRating');
}
