import { DataTypes, type Sequelize } from 'sequelize';

export const key = '0.11.3';

export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  await queryInterface.changeColumn('Asset', 'AppId', {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'App',
      key: 'id',
    },
  });
}

export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  await queryInterface.changeColumn('Asset', 'AppId', {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'App',
      key: 'id',
    },
  });
}
