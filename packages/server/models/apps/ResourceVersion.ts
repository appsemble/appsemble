import { type ResourceVersion as ResourceVersionType } from '@appsemble/types';
import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  IsUUID,
  Model,
  PrimaryKey,
  type Sequelize,
  Table,
} from 'sequelize-typescript';

import { type AppMember, type AppModels, type Resource } from '../index.js';

export class ResourceVersionGlobal extends Model {
  id!: string;

  data?: any;

  created!: Date;

  ResourceId!: number;

  Resource?: Awaited<Resource>;

  AppMemberId?: string;

  AppMember?: Awaited<AppMember>;

  toJSON(): ResourceVersionType {
    return {
      created: this.created.toISOString(),
      data: this.data,
      author: this.AppMember ? { id: this.AppMember.id, name: this.AppMember.name } : undefined,
    };
  }
}

export function createResourceVersionModel(sequelize: Sequelize): typeof ResourceVersionGlobal {
  @Table({ tableName: 'ResourceVersion', updatedAt: false })
  class ResourceVersion extends ResourceVersionGlobal {
    @PrimaryKey
    @IsUUID(4)
    @Default(DataType.UUIDV4)
    @Column(DataType.UUID)
    id!: string;

    @Column(DataType.JSON)
    data?: any;

    @CreatedAt
    created!: Date;

    @AllowNull(false)
    @Column(DataType.INTEGER)
    ResourceId!: number;

    @Column(DataType.UUID)
    AppMemberId?: string;

    static associate(models: AppModels): void {
      ResourceVersion.belongsTo(models.Resource, {
        foreignKey: 'ResourceId',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
      ResourceVersion.belongsTo(models.AppMember, {
        foreignKey: 'AppMemberId',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
    }

    toJSON(): ResourceVersionType {
      return {
        created: this.created.toISOString(),
        data: this.data,
        author: this.AppMember
          ? { id: this.AppMember.id, name: this.AppMember.name, email: this.AppMember.email }
          : undefined,
      };
    }
  }

  sequelize.addModels([ResourceVersion]);
  return ResourceVersion;
}
