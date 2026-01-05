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

export class AppWebhookSecretGlobal extends Model {
  declare id: string;

  declare name?: string;

  declare webhookName: string;

  declare secret: Buffer;

  declare created: Date;

  declare updated: Date;
}

export function createAppWebhookSecretModel(sequelize: Sequelize): typeof AppWebhookSecretGlobal {
  @Table({ tableName: 'AppWebhookSecret' })
  class AppWebhookSecret extends AppWebhookSecretGlobal {
    @PrimaryKey
    @IsUUID(4)
    @Default(DataType.UUIDV4)
    @Column(DataType.UUID)
    declare id: string;

    @Column(DataType.STRING)
    declare name?: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare webhookName: string;

    @AllowNull(false)
    @Column(DataType.BLOB)
    declare secret: Buffer;

    @CreatedAt
    declare created: Date;

    @UpdatedAt
    declare updated: Date;
  }

  sequelize.addModels([AppWebhookSecret]);
  return AppWebhookSecret;
}
