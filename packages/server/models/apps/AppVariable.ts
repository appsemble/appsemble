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
  id!: number;

  name!: string;

  value?: string;

  created!: Date;

  updated!: Date;
}

export function createAppVariableModel(sequelize: Sequelize): typeof AppVariableGlobal {
  @Table({ tableName: 'AppVariable' })
  class AppVariable extends AppVariableGlobal {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id!: number;

    @AllowNull(false)
    @Index({ name: 'UniqueNameIndex', unique: true })
    @Column(DataType.STRING)
    name!: string;

    @Column(DataType.STRING)
    value?: string;

    @CreatedAt
    created!: Date;

    @UpdatedAt
    updated!: Date;
  }

  sequelize.addModels([AppVariable]);
  return AppVariable;
}
