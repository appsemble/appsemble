import { Column, DataType, Model, PrimaryKey, Table } from 'sequelize-typescript';

/**
 * Define database metadata.
 */
@Table({ tableName: 'Meta', createdAt: false, updatedAt: false })
export class Meta extends Model {
  /**
   * The current version of the database.
   *
   * This field _**must**_ stay consistent across versions!
   */
  @PrimaryKey
  @Column(DataType.STRING)
  declare version: string;
}
