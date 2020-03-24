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
      /**
       * This refers to the organization and name of a block
       * it is agnostic of the version of the block.
       *
       * Format: @organizationName/blockName
       */
      block: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
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

  AppBlockStyle.associate = ({ App }) => {
    AppBlockStyle.belongsTo(App);
  };

  return AppBlockStyle;
};
