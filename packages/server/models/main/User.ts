import {
  AllowNull,
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  Default,
  DeletedAt,
  ForeignKey,
  HasMany,
  Index,
  IsUUID,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import {
  EmailAuthorization,
  OAuthAuthorization,
  Organization,
  OrganizationMember,
  ResetPasswordToken,
  TrainingCompleted,
} from '../index.js';

@Table({ tableName: 'User', paranoid: true })
export class User extends Model {
  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column(DataType.STRING)
  declare name?: string;

  @ForeignKey(() => EmailAuthorization)
  @Index({ name: 'UniqueUserEmail', unique: true })
  @Column(DataType.STRING)
  declare primaryEmail?: string;

  @Column(DataType.STRING)
  declare password?: string;

  @Column(DataType.STRING)
  declare locale?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare timezone: string;

  @AllowNull(false)
  @Default(true)
  @Column(DataType.BOOLEAN)
  declare subscribed: boolean;

  @BelongsToMany(() => Organization, () => OrganizationMember)
  declare Organizations: Organization[];

  @HasMany(() => EmailAuthorization)
  declare EmailAuthorizations: EmailAuthorization[];

  @HasMany(() => OAuthAuthorization)
  declare OAuthAuthorizations: OAuthAuthorization[];

  @HasMany(() => ResetPasswordToken, { onDelete: 'CASCADE' })
  declare ResetPasswordTokens: ResetPasswordToken[];

  @HasMany(() => TrainingCompleted)
  declare CompletedTrainings: TrainingCompleted[];

  @CreatedAt
  declare created: Date;

  @UpdatedAt
  declare updated: Date;

  @DeletedAt
  declare deleted?: Date;

  declare OrganizationMember?: OrganizationMember;
}
