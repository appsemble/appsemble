import { DataTypes } from 'sequelize';

/**
 * Define database metadata.
 */
export default sequelize => {
  const Meta = sequelize.define(
    'Meta',
    {
      /**
       * The current version of the database.
       *
       * This field _**must**_ stay consistent across versions!
       */
      version: { type: DataTypes.STRING(11), primaryKey: true },
    },
    {
      freezeTableName: true,
      timestamps: false,
    },
  );
  Meta.associate = () => {};
  return Meta;
};
