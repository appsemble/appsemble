import { InvoiceStatus, SubscriptionPlanType } from '@appsemble/types';
import {
  AllowNull,
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  Default,
  DeletedAt,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { InvoiceTransaction } from './InvoiceTransaction.js';

@Table({ tableName: 'Invoice', paranoid: true })
export class Invoice extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  subscriptionId!: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  organizationId!: string;

  @Column(DataType.STRING)
  reference?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  amount!: string;

  @Column(DataType.STRING(24))
  vatIdNumber?: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  vatPercentage!: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  customerName!: string;

  @Default(InvoiceStatus.Pending)
  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(InvoiceStatus)))
  invoiceStatus!: InvoiceStatus;

  @Column(DataType.ENUM(...Object.values(SubscriptionPlanType)))
  subscriptionPlan!: SubscriptionPlanType;

  @Column(DataType.STRING)
  stripeInvoiceId?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  customerStreetName!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  customerHouseNumber!: string;

  @AllowNull(false)
  @Column(DataType.STRING(85))
  customerCity!: string;

  @AllowNull(false)
  @Column(DataType.STRING(15))
  customerZipCode!: string;

  @AllowNull(false)
  @Column(DataType.STRING(2))
  customerCountryCode!: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  kvkNumber!: number;

  @AllowNull(false)
  @Column(DataType.TEXT)
  serviceSupplied!: string;

  @AllowNull(true)
  @Column(DataType.BLOB)
  pdfInvoice!: Buffer;

  @AllowNull(false)
  @Column(DataType.DATE)
  activationDate!: Date;

  @AllowNull(false)
  @Column(DataType.STRING(8))
  invoiceNumberPrefix!: string;

  @HasMany(() => InvoiceTransaction)
  InvoiceTransaction!: InvoiceTransaction;

  @CreatedAt
  created!: Date;

  @UpdatedAt
  updated?: Date;

  @DeletedAt
  deleted?: Date;
}
