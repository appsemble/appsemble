import { Column, DataType, Model, PrimaryKey, type Sequelize, Table } from 'sequelize-typescript';

/**
 * Define database metadata.
 */
export class AppMetaGlobal extends Model {
  /**
   * The current version of the database.
   *
   * This field _**must**_ stay consistent across versions!
   */
  declare version: string;
}

export function createAppMetaModel(sequelize: Sequelize): typeof AppMetaGlobal {
  @Table({ tableName: 'Meta', createdAt: false, updatedAt: false })
  class AppMeta extends AppMetaGlobal {
    @PrimaryKey
    @Column(DataType.STRING)
    declare version: string;
  }

  sequelize.addModels([AppMeta]);
  return AppMeta;
}
