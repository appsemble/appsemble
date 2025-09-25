import { AllowNull, Column, DataType, Model, PrimaryKey, Table } from 'sequelize-typescript';

@Table({ tableName: 'Coupon' })
export class Coupon extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  code!: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  discount!: number;
}
