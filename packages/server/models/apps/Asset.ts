import { type DestroyOptions } from 'sequelize';
import {
  AfterDestroy,
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  DeletedAt,
  Index,
  Model,
  PrimaryKey,
  type Sequelize,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { type AppMember, type AppModels, type Group, type Resource } from '../index.js';

export class AssetGlobal extends Model {
  id!: string;

  mime?: string;

  filename?: string;

  name?: string;

  clonable!: boolean;

  seed!: boolean;

  ephemeral!: boolean;

  created!: Date;

  updated!: Date;

  deleted?: Date;

  GroupId?: number;

  AppMemberId?: string;

  ResourceId?: number;

  Group?: Awaited<Group>;

  AppMember?: Awaited<AppMember>;

  Resource?: Awaited<Resource>;
}

export function createAssetModel(sequelize: Sequelize): typeof AssetGlobal {
  @Table({ tableName: 'Asset', paranoid: true })
  class Asset extends AssetGlobal {
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column(DataType.STRING)
    id!: string;

    @Column(DataType.STRING)
    mime?: string;

    @Column(DataType.STRING)
    filename?: string;

    @Index({ name: 'UniqueAssetWithNullGroupId', unique: true })
    @Index({ name: 'UniqueAssetWithGroupId', unique: true })
    @Index({ name: 'assetNameIndex' })
    @Column(DataType.STRING)
    name?: string;

    /**
     * If true, the asset will be transferred when cloning an app
     */
    @AllowNull(false)
    @Default(false)
    @Column(DataType.BOOLEAN)
    clonable!: boolean;

    /**
     * If true, the asset will be used for creating ephemeral assets in demo apps
     */
    @AllowNull(false)
    @Default(false)
    @Column(DataType.BOOLEAN)
    seed!: boolean;

    /**
     * If true, the asset is cleaned up regularly
     */
    @AllowNull(false)
    @Default(false)
    @Index({ name: 'UniqueAssetWithNullGroupId', unique: true })
    @Index({ name: 'UniqueAssetWithGroupId', unique: true })
    @Column(DataType.BOOLEAN)
    ephemeral!: boolean;

    @CreatedAt
    created!: Date;

    @UpdatedAt
    updated!: Date;

    @DeletedAt
    deleted?: Date;

    @AllowNull(true)
    @Index({ name: 'UniqueAssetWithGroupId', unique: true })
    @Column(DataType.INTEGER)
    GroupId?: number;

    @Column(DataType.UUID)
    AppMemberId?: string;

    @Column(DataType.INTEGER)
    ResourceId?: number;

    static associate(models: AppModels): void {
      Asset.belongsTo(models.Group, {
        foreignKey: 'GroupId',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
      Asset.belongsTo(models.AppMember, {
        foreignKey: 'AppMemberId',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
      Asset.belongsTo(models.Resource, {
        foreignKey: 'ResourceId',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
    }

    @AfterDestroy
    static async afterDestroyHook(instance: Asset, { force }: DestroyOptions): Promise<void> {
      if (force || !instance?.ephemeral) {
        return;
      }
      await instance.destroy({ force: true });
    }
  }

  sequelize.addModels([Asset]);
  return Asset;
}
