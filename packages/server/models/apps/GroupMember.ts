import { type AppRole } from '@appsemble/lang-sdk';
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
  UpdatedAt,
} from 'sequelize-typescript';

import { type AppMember, type AppModels, type Group } from '../index.js';

export class GroupMemberGlobal extends Model {
  declare id: string;

  declare role: AppRole;

  declare created: Date;

  declare updated: Date;

  declare AppMemberId: string;

  declare GroupId: number;

  declare AppMember?: Awaited<AppMember>;

  declare Group?: Awaited<Group>;
}

export function createGroupMemberModel(sequelize: Sequelize): typeof GroupMemberGlobal {
  @Table({ tableName: 'GroupMember' })
  class GroupMember extends GroupMemberGlobal {
    @PrimaryKey
    @IsUUID(4)
    @Default(DataType.UUIDV4)
    @Column(DataType.UUID)
    declare id: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare role: AppRole;

    @CreatedAt
    declare created: Date;

    @UpdatedAt
    declare updated: Date;

    @PrimaryKey
    @Column(DataType.UUID)
    declare AppMemberId: string;

    @PrimaryKey
    @Column(DataType.INTEGER)
    declare GroupId: number;

    static associate(models: AppModels): void {
      GroupMember.belongsTo(models.AppMember, {
        foreignKey: 'AppMemberId',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
      GroupMember.belongsTo(models.Group, {
        foreignKey: 'GroupId',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
    }
  }

  sequelize.addModels([GroupMember]);
  return GroupMember;
}
