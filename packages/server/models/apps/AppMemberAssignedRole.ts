import { type AppRole } from '@appsemble/lang-sdk';
import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  Index,
  Model,
  PrimaryKey,
  type Sequelize,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { type AppMember, type AppModels } from '../index.js';

export class AppMemberAssignedRoleGlobal extends Model {
  declare role: AppRole;

  declare source: string;

  declare externalGroup?: string | null;

  declare created: Date;

  declare updated: Date;

  declare AppMemberId: string;

  declare AppMember?: Awaited<AppMember>;
}

export function createAppMemberAssignedRoleModel(
  sequelize: Sequelize,
): typeof AppMemberAssignedRoleGlobal {
  @Table({ tableName: 'AppMemberAssignedRole' })
  class AppMemberAssignedRole extends AppMemberAssignedRoleGlobal {
    @PrimaryKey
    @Column(DataType.UUID)
    declare AppMemberId: string;

    @PrimaryKey
    @AllowNull(false)
    @Index
    @Column(DataType.STRING)
    declare role: AppRole;

    @AllowNull(false)
    @Default('manual')
    @Index
    @Column(DataType.STRING)
    declare source: string;

    @AllowNull(true)
    @Column(DataType.STRING)
    declare externalGroup?: string | null;

    @CreatedAt
    declare created: Date;

    @UpdatedAt
    declare updated: Date;

    static associate(models: AppModels): void {
      AppMemberAssignedRole.belongsTo(models.AppMember, {
        foreignKey: 'AppMemberId',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
    }
  }

  sequelize.addModels([AppMemberAssignedRole]);
  return AppMemberAssignedRole;
}
