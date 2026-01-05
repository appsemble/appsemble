import {
  AfterUpdate,
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

import { type AppMember } from '../index.js';

@Table({ tableName: 'AppMemberEmailAuthorization' })
export class AppMemberEmailAuthorizationGlobal extends Model {
  declare email: string;

  declare verified: boolean;

  declare key?: string;

  declare created: Date;

  declare updated: Date;

  declare AppMemberId: string;

  declare AppMember?: AppMember;
}

export function createAppMemberEmailAuthorizationModel(
  sequelize: Sequelize,
): typeof AppMemberEmailAuthorizationGlobal {
  @Table({ tableName: 'AppMemberEmailAuthorization' })
  class AppMemberEmailAuthorization extends AppMemberEmailAuthorizationGlobal {
    @AllowNull(false)
    @Column(DataType.STRING)
    declare email: string;

    @Default(false)
    @AllowNull(false)
    @Column(DataType.BOOLEAN)
    declare verified: boolean;

    @Column(DataType.STRING)
    declare key?: string;

    @CreatedAt
    declare created: Date;

    @UpdatedAt
    declare updated: Date;

    @AllowNull(false)
    @PrimaryKey
    @Column(DataType.UUID)
    declare AppMemberId: string;

    // Auto delete instances when an email is verified
    @AfterUpdate
    static async deleteVerified(instance: AppMemberEmailAuthorization): Promise<void> {
      if (instance.verified) {
        await instance.destroy();
      }
    }
  }
  sequelize.addModels([AppMemberEmailAuthorization]);
  return AppMemberEmailAuthorization;
}
