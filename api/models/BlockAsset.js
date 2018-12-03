/**
 * Blob assets may be stored in the database before a block version itself is actually stored.
 *
 * This is all handled in a transaction, but it is the reason the primary key may not be a compound
 * primary key which includes the block version reference. For this reason, a numeric id is used as
 * the primary key..
 */
export default (sequelize, DataTypes) =>
  sequelize.define(
    'BlockAsset',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      filename: { type: DataTypes.STRING },
      mime: { type: DataTypes.STRING },
      content: { type: DataTypes.BLOB('long') },
    },
    {
      freezeTableName: true,
      paranoid: true,
      createdAt: 'created',
      updatedAt: 'updated',
      deletedAt: 'deleted',
    },
  );
