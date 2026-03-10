import {
  AllowNull,
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  Index,
  Model,
  PrimaryKey,
  type Sequelize,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

export class AppVariableGlobal extends Model {
  declare id: number;

  declare name: string;

  declare value?: string;

  declare created: Date;

  declare updated: Date;
}

export function createAppVariableModel(sequelize: Sequelize): typeof AppVariableGlobal {
  @Table({ tableName: 'AppVariable' })
  class AppVariable extends AppVariableGlobal {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    declare id: number;

    @AllowNull(false)
    @Index({ name: 'UniqueNameIndex', unique: true })
    @Column(DataType.STRING)
    declare name: string;

    @Column(DataType.STRING)
    declare value?: string;

    @CreatedAt
    declare created: Date;

    @UpdatedAt
    declare updated: Date;
  }

  sequelize.addModels([AppVariable]);
  return AppVariable;
}
