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
  email!: string;

  verified!: boolean;

  key?: string;

  created!: Date;

  updated!: Date;

  AppMemberId!: string;

  AppMember?: AppMember;
}

export function createAppMemberEmailAuthorizationModel(
  sequelize: Sequelize,
): typeof AppMemberEmailAuthorizationGlobal {
  @Table({ tableName: 'AppMemberEmailAuthorization' })
  class AppMemberEmailAuthorization extends AppMemberEmailAuthorizationGlobal {
    @AllowNull(false)
    @Column(DataType.STRING)
    email!: string;

    @Default(false)
    @AllowNull(false)
    @Column(DataType.BOOLEAN)
    verified!: boolean;

    @Column(DataType.STRING)
    key?: string;

    @CreatedAt
    created!: Date;

    @UpdatedAt
    updated!: Date;

    @AllowNull(false)
    @PrimaryKey
    @Column(DataType.UUID)
    AppMemberId!: string;

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
