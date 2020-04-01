import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const ResourceSubscription = sequelize.define(
    'ResourceSubscription',
    {
      type: {
        type: DataTypes.STRING,
      },
      action: {
        type: DataTypes.STRING,
      },
    },
    {
      freezeTableName: true,
      createdAt: 'created',
      updatedAt: 'updated',
    },
  );

  ResourceSubscription.associate = ({ AppSubscription, Resource }) => {
    ResourceSubscription.belongsTo(AppSubscription);
    ResourceSubscription.belongsTo(Resource);
  };

  return ResourceSubscription;
};
