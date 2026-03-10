import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  type Sequelize,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

export class AppBlockStyleGlobal extends Model {
  /**
   * This refers to the organization and name of a block
   * it is agnostic of the version of the block.
   *
   * Format: @organizationName/blockName
   */
  declare block: string;

  declare style?: string;

  declare created: Date;

  declare updated: Date;
}

export function createAppBlockStyleModel(sequelize: Sequelize): typeof AppBlockStyleGlobal {
  @Table({ tableName: 'AppBlockStyle' })
  class AppBlockStyle extends AppBlockStyleGlobal {
    @PrimaryKey
    @AllowNull(false)
    @Column(DataType.STRING)
    declare block: string;

    @Column({ type: DataType.TEXT })
    declare style?: string;

    @CreatedAt
    declare created: Date;

    @UpdatedAt
    declare updated: Date;
  }

  sequelize.addModels([AppBlockStyle]);
  return AppBlockStyle;
}
