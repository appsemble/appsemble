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
  declare id: string;

  declare data?: any;

  declare created: Date;

  declare ResourceId: number;

  declare Resource?: Awaited<Resource>;

  declare AppMemberId?: string;

  declare AppMember?: Awaited<AppMember>;

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
    declare id: string;

    @Column(DataType.JSON)
    declare data?: any;

    @CreatedAt
    declare created: Date;

    @AllowNull(false)
    @Column(DataType.INTEGER)
    declare ResourceId: number;

    @Column(DataType.UUID)
    declare AppMemberId?: string;

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
