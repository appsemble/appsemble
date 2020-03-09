import { DataTypes } from 'sequelize';

export default sequelize => {
  const AppBlockStyle = sequelize.define(
    'AppBlockStyle',
    {
      AppId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: { model: 'App' },
      },
      BlockDefinitionId: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
        references: { model: 'BlockDefinition' },
      },
      style: { type: DataTypes.TEXT },
    },
    {
      freezeTableName: true,
      // XXX: Setting this to true causes issues with the test truncate() function.
      paranoid: false,
      createdAt: 'created',
      updatedAt: 'updated',
      deletedAt: 'deleted',
    },
  );

  AppBlockStyle.associate = ({ App, BlockDefinition }) => {
    AppBlockStyle.belongsTo(App);
    AppBlockStyle.belongsTo(BlockDefinition);
  };

  return AppBlockStyle;
};
