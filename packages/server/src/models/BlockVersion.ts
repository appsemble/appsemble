import type { ActionType, BlockManifest } from '@appsemble/types';
import { DataTypes, Model, Sequelize } from 'sequelize';

import BlockAsset from './BlockAsset';
import Organization from './Organization';

export default class BlockVersion extends Model implements Omit<BlockManifest, 'files'> {
  OrganizationId: string;

  name: string;

  version: string;

  layout?: 'float' | 'static' | 'grow' | 'hidden' | null;

  icon: Buffer;

  description: string;

  longDescription: string;

  parameters: object;

  resources: any;

  actions?: { [key: string]: ActionType };

  events: {
    listen?: string[];
    emit?: string[];
  };

  BlockAssets?: BlockAsset[];

  static initialize(sequelize: Sequelize): void {
    BlockVersion.init(
      {
        OrganizationId: {
          type: DataTypes.STRING,
          primaryKey: true,
          allowNull: false,
          references: { model: 'Organization' },
        },
        name: { type: DataTypes.STRING, primaryKey: true, unique: 'blockVersionComposite' },
        version: { type: DataTypes.STRING, primaryKey: true, unique: 'blockVersionComposite' },
        description: { type: DataTypes.TEXT },
        longDescription: { type: DataTypes.TEXT },
        icon: { type: DataTypes.BLOB },
        layout: { type: DataTypes.STRING },
        actions: { type: DataTypes.JSON },
        parameters: { type: DataTypes.JSON },
        resources: { type: DataTypes.JSON },
        events: { type: DataTypes.JSON },
      },
      {
        sequelize,
        tableName: 'BlockVersion',
        createdAt: 'created',
        updatedAt: false,
      },
    );
  }

  static associate(): void {
    BlockVersion.hasMany(BlockAsset, { foreignKey: 'name', sourceKey: 'name' });
    BlockVersion.hasMany(BlockAsset, { foreignKey: 'version', sourceKey: 'version' });
    BlockVersion.belongsTo(Organization, { foreignKey: { allowNull: false } });
  }
}
