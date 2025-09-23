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
  block!: string;

  style?: string;

  created!: Date;

  updated!: Date;
}

export function createAppBlockStyleModel(sequelize: Sequelize): typeof AppBlockStyleGlobal {
  @Table({ tableName: 'AppBlockStyle' })
  class AppBlockStyle extends AppBlockStyleGlobal {
    @PrimaryKey
    @AllowNull(false)
    @Column(DataType.STRING)
    block!: string;

    @Column({ type: DataType.TEXT })
    style?: string;

    @CreatedAt
    created!: Date;

    @UpdatedAt
    updated!: Date;
  }

  sequelize.addModels([AppBlockStyle]);
  return AppBlockStyle;
}
