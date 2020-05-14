import { DataTypes, Model, Sequelize } from 'sequelize';

import Organization from './Organization';

/**
 * Blob assets may be stored in the database before a block version itself is actually stored.
 *
 * This is all handled in a transaction, but it is the reason the primary key may not be a compound
 * primary key which includes the block version reference. For this reason, a numeric id is used as
 * the primary key..
 */
export default class BlockAsset extends Model {
  id: number;

  content: Buffer;

  filename: string;

  mime: string;

  static initialize(sequelize: Sequelize): void {
    BlockAsset.init(
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        filename: { type: DataTypes.STRING },
        mime: { type: DataTypes.STRING },
        content: { type: DataTypes.BLOB },
      },
      {
        sequelize,
        tableName: 'BlockAsset',
        createdAt: 'created',
        updatedAt: false,
      },
    );
  }

  static associate(): void {
    BlockAsset.belongsTo(Organization, { foreignKey: { allowNull: false } });
  }
}
