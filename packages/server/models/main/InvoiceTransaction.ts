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
  id!: number;

  @AllowNull(false)
  @ForeignKey(() => Invoice)
  @Index({ name: 'InvoiceTransaction_path_InvoiceId_key', unique: false })
  @Column(DataType.INTEGER)
  InvoiceId!: number;

  @BelongsTo(() => Invoice)
  invoice!: Invoice;

  @AllowNull(false)
  @Column(DataType.DATE)
  timestamp!: Date;

  @AllowNull(false)
  @Column(DataType.STRING)
  status!: string;

  @CreatedAt
  created!: Date;

  @UpdatedAt
  updated?: Date;
}
