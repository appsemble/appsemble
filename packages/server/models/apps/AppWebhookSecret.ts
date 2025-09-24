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
  id!: string;

  name?: string;

  webhookName!: string;

  secret!: Buffer;

  created!: Date;

  updated!: Date;
}

export function createAppWebhookSecretModel(sequelize: Sequelize): typeof AppWebhookSecretGlobal {
  @Table({ tableName: 'AppWebhookSecret' })
  class AppWebhookSecret extends AppWebhookSecretGlobal {
    @PrimaryKey
    @IsUUID(4)
    @Default(DataType.UUIDV4)
    @Column(DataType.UUID)
    id!: string;

    @Column(DataType.STRING)
    name?: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    webhookName!: string;

    @AllowNull(false)
    @Column(DataType.BLOB)
    secret!: Buffer;

    @CreatedAt
    created!: Date;

    @UpdatedAt
    updated!: Date;
  }

  sequelize.addModels([AppWebhookSecret]);
  return AppWebhookSecret;
}
