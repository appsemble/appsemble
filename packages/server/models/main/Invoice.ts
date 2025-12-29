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
  declare id: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare subscriptionId: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare organizationId: string;

  @Column(DataType.STRING)
  declare reference?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare amount: string;

  @Column(DataType.STRING(24))
  declare vatIdNumber?: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare vatPercentage: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare customerName: string;

  @Default(InvoiceStatus.Pending)
  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(InvoiceStatus)))
  declare invoiceStatus: InvoiceStatus;

  @Column(DataType.ENUM(...Object.values(SubscriptionPlanType)))
  declare subscriptionPlan: SubscriptionPlanType;

  @Column(DataType.STRING)
  declare stripeInvoiceId?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare customerStreetName: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare customerHouseNumber: string;

  @AllowNull(false)
  @Column(DataType.STRING(85))
  declare customerCity: string;

  @AllowNull(false)
  @Column(DataType.STRING(15))
  declare customerZipCode: string;

  @AllowNull(false)
  @Column(DataType.STRING(2))
  declare customerCountryCode: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare kvkNumber: number;

  @AllowNull(false)
  @Column(DataType.TEXT)
  declare serviceSupplied: string;

  @AllowNull(true)
  @Column(DataType.BLOB)
  declare pdfInvoice: Buffer;

  @AllowNull(false)
  @Column(DataType.DATE)
  declare activationDate: Date;

  @AllowNull(false)
  @Column(DataType.STRING(8))
  declare invoiceNumberPrefix: string;

  @HasMany(() => InvoiceTransaction)
  declare InvoiceTransaction: InvoiceTransaction;

  @CreatedAt
  declare created: Date;

  @UpdatedAt
  declare updated?: Date;

  @DeletedAt
  declare deleted?: Date;
}
