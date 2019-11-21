import { DataTypes } from 'sequelize';

export default {
  key: '0.9.4',

  async up(db) {
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
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: 'UniqueRatingIndex',
        references: {
          model: 'App',
          key: 'id',
        },
      },
      UserId: {
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
  },

  async down(db) {
    const queryInterface = db.getQueryInterface();
    await queryInterface.removeColumn('App', 'template');
    await queryInterface.dropTable('AppRating');
  },
};
