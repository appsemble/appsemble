import { type DestroyOptions, Op } from 'sequelize';
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
  declare id: string;

  declare mime?: string;

  declare filename?: string;

  declare name?: string;

  declare clonable: boolean;

  declare seed: boolean;

  declare ephemeral: boolean;

  declare created: Date;

  declare updated: Date;

  declare deleted?: Date;

  declare GroupId?: number;

  declare AppMemberId?: string;

  declare ResourceId?: number;

  declare Group?: Awaited<Group>;

  declare AppMember?: Awaited<AppMember>;

  declare Resource?: Awaited<Resource>;
}

export function createAssetModel(sequelize: Sequelize): typeof AssetGlobal {
  @Table({ tableName: 'Asset', paranoid: true })
  class Asset extends AssetGlobal {
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column(DataType.STRING)
    declare id: string;

    @Column(DataType.STRING)
    declare mime?: string;

    @Column(DataType.STRING)
    declare filename?: string;

    @Index({
      name: 'UniqueAssetWithNullGroupId',
      unique: true,
      where: { GroupId: { [Op.is]: null }, deleted: { [Op.is]: null } },
    })
    @Index({
      name: 'UniqueAssetWithGroupId',
      unique: true,
      where: { GroupId: { [Op.not]: null }, deleted: { [Op.is]: null } },
    })
    @Index({ name: 'assetNameIndex' })
    @Column(DataType.STRING)
    declare name?: string;

    /**
     * If true, the asset will be transferred when cloning an app
     */
    @AllowNull(false)
    @Default(false)
    @Column(DataType.BOOLEAN)
    declare clonable: boolean;

    /**
     * If true, the asset will be used for creating ephemeral assets in demo apps
     */
    @AllowNull(false)
    @Default(false)
    @Column(DataType.BOOLEAN)
    declare seed: boolean;

    /**
     * If true, the asset is cleaned up regularly
     */
    @AllowNull(false)
    @Default(false)
    @Index({
      name: 'UniqueAssetWithNullGroupId',
      unique: true,
      where: { GroupId: { [Op.is]: null }, deleted: { [Op.is]: null } },
    })
    @Index({
      name: 'UniqueAssetWithGroupId',
      unique: true,
      where: { GroupId: { [Op.not]: null }, deleted: { [Op.is]: null } },
    })
    @Column(DataType.BOOLEAN)
    declare ephemeral: boolean;

    @CreatedAt
    declare created: Date;

    @UpdatedAt
    declare updated: Date;

    @DeletedAt
    declare deleted?: Date;

    @AllowNull(true)
    @Index({
      name: 'UniqueAssetWithGroupId',
      unique: true,
      where: { GroupId: { [Op.not]: null }, deleted: { [Op.is]: null } },
    })
    @Column(DataType.INTEGER)
    declare GroupId?: number;

    @Column(DataType.UUID)
    declare AppMemberId?: string;

    @Column(DataType.INTEGER)
    declare ResourceId?: number;

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
