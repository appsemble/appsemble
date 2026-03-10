import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Index,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { Invoice } from './Invoice.js';

@Table({ tableName: 'InvoiceTransaction' })
export class InvoiceTransaction extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @AllowNull(false)
  @ForeignKey(() => Invoice)
  @Index({ name: 'InvoiceTransaction_path_InvoiceId_key', unique: false })
  @Column(DataType.INTEGER)
  declare InvoiceId: number;

  @BelongsTo(() => Invoice)
  declare invoice: Invoice;

  @AllowNull(false)
  @Column(DataType.DATE)
  declare timestamp: Date;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare status: string;

  @CreatedAt
  declare created: Date;

  @UpdatedAt
  declare updated?: Date;
}
