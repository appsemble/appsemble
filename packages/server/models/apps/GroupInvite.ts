import { type AppRole } from '@appsemble/lang-sdk';
import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  Model,
  PrimaryKey,
  type Sequelize,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { type AppModels, type Group } from '../index.js';

export class GroupInviteGlobal extends Model {
  declare email: string;

  declare key: string;

  declare role: AppRole;

  declare created: Date;

  declare updated: Date;

  declare GroupId: number;

  declare Group?: Awaited<Group>;

  toJSON(): { id: number; name: string } {
    // Here we assume you queried with `{ include: Group }`
    return {
      // @ts-expect-error 2532 object is possibly undefined (strictNullChecks)
      id: this.GroupId ?? this.Group.id,
      // @ts-expect-error 2532 object is possibly undefined (strictNullChecks)
      name: this.Group.name,
    };
  }
}

export function createGroupInviteModel(sequelize: Sequelize): typeof GroupInviteGlobal {
  @Table({ tableName: 'GroupInvite' })
  class GroupInvite extends GroupInviteGlobal {
    @PrimaryKey
    @AllowNull(false)
    @Column(DataType.STRING)
    declare email: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare key: string;

    @Default('Member')
    @AllowNull(false)
    @Column(DataType.STRING)
    declare role: AppRole;

    @CreatedAt
    declare created: Date;

    @UpdatedAt
    declare updated: Date;

    @PrimaryKey
    @AllowNull(false)
    @Column(DataType.INTEGER)
    declare GroupId: number;

    static associate(models: AppModels): void {
      GroupInvite.belongsTo(models.Group, {
        foreignKey: 'GroupId',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
    }

    toJSON(): { id: number; name: string } {
      // Here we assume you queried with `{ include: Group }`
      return {
        // @ts-expect-error 2532 object is possibly undefined (strictNullChecks)
        id: this.GroupId ?? this.Group.id,
        // @ts-expect-error 2532 object is possibly undefined (strictNullChecks)
        name: this.Group.name,
      };
    }
  }

  sequelize.addModels([GroupInvite]);
  return GroupInvite;
}
