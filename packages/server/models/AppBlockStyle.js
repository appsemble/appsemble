export default (sequelize, DataTypes) => {
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
      style: { type: DataTypes.TEXT('long') },
    },
    {
      freezeTableName: true,
      paranoid: true,
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
