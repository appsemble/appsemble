import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

import { Organization } from '../../models/index.js';

export const key = '0.35.1';

/**
 * Summary:
 * - Create table `invoice`
 * - Create table `coupon`
 * - Create table `organizationSubscription`
 * - Add columns preferredPaymentProvider, vatIdNumber, streetName, houseNumber,
 * city, zipCode, countryCode, customerName and invoiceReference to table `Organization`
 * - Add columns stripeApiSecretKey, stripeWebhookSecret, cancelUrl and successUrl to table `App`
 *
 * @param transaction The sequelize Transaction.
 * @param db The sequelize database.
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Create table `invoice`');
  await queryInterface.createTable(
    'Invoice',
    {
      id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      subscriptionId: { type: DataTypes.INTEGER, allowNull: false },
      organizationId: { type: DataTypes.STRING, allowNull: false },
      reference: { type: DataTypes.STRING, allowNull: true },
      amount: { type: DataTypes.STRING, allowNull: false },
      vatIdNumber: { type: DataTypes.STRING(24), allowNull: true },
      vatPercentage: { type: DataTypes.INTEGER, allowNull: false },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      deleted: { type: DataTypes.DATE },
      customerName: { type: DataTypes.STRING(255), allowNull: false },
      invoiceStatus: {
        type: DataTypes.ENUM('pending', 'paid', 'retry', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      subscriptionPlan: {
        type: DataTypes.ENUM('free', 'basic', 'standard', 'extensive', 'enterprise'),
        allowNull: true,
      },
      stripeInvoiceId: { type: DataTypes.STRING, allowNull: true },
      customerStreetName: { type: DataTypes.STRING(255), allowNull: false },
      customerHouseNumber: { type: DataTypes.STRING, allowNull: false },
      customerCity: { type: DataTypes.STRING(85), allowNull: false },
      customerZipCode: { type: DataTypes.STRING(15), allowNull: false },
      customerCountryCode: { type: DataTypes.STRING(2), allowNull: false },
      kvkNumber: { type: DataTypes.INTEGER, allowNull: false },
      serviceSupplied: { type: DataTypes.TEXT, allowNull: false },
      activationDate: { type: DataTypes.DATE, allowNull: false },
      invoiceNumberPrefix: { type: DataTypes.STRING(8), allowNull: false },
      pdfInvoice: { type: DataTypes.BLOB, allowNull: true },
    },
    { transaction },
  );

  logger.info('Create table `invoiceTransaction`');
  await queryInterface.createTable(
    'InvoiceTransaction',
    {
      id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      InvoiceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Invoice', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      timestamp: { type: DataTypes.DATE, allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );

  logger.info('Add index to `invoiceTransaction` table.');
  await queryInterface.addIndex('InvoiceTransaction', ['InvoiceId'], {
    name: 'InvoiceTransaction_path_InvoiceId_key',
    unique: false,
    transaction,
  });

  logger.info('Create table `coupon`');
  await queryInterface.createTable(
    'Coupon',
    {
      code: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
      discount: { type: DataTypes.INTEGER, allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );

  logger.info('Create table `organizationSubscription`');
  await queryInterface.createTable(
    'OrganizationSubscription',
    {
      id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      cancelled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      cancellationReason: { type: DataTypes.TEXT, allowNull: true },
      cancelledAt: { type: DataTypes.DATE, allowNull: true },
      expirationDate: { type: DataTypes.DATEONLY, allowNull: true },
      subscriptionPlan: {
        type: DataTypes.ENUM('free', 'basic', 'standard', 'extensive', 'enterprise'),
        allowNull: false,
        defaultValue: 'free',
      },
      OrganizationId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: { model: 'Organization', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      renewalPeriod: {
        type: DataTypes.ENUM('month', 'year'),
        allowNull: true,
      },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );

  logger.info('Add index to `organizationSubscriptions` table.');
  await queryInterface.addIndex('OrganizationSubscription', ['OrganizationId'], {
    name: 'OrganizationSubscription_path_OrganizationId_key',
    unique: true,
    transaction,
  });

  logger.info('Applying initial subscriptions to current users');
  const organizations = await Organization.findAll({ attributes: ['id'] });

  const newSubscriptions = organizations.map((organization) => ({
    cancelled: true,
    expirationDate: new Date('2026-01-01'),
    subscriptionPlan: 'basic',
    OrganizationId: organization.id,
    created: new Date(),
    updated: new Date(),
  }));

  if (newSubscriptions.length) {
    await queryInterface.bulkInsert('OrganizationSubscription', newSubscriptions, { transaction });
    logger.info('Applied initial subscriptions');
  } else {
    logger.info('No subscriptions have been created');
  }

  logger.info('Add column `preferredPaymentProvider` to table `Organization`');
  await queryInterface.addColumn(
    'Organization',
    'preferredPaymentProvider',
    {
      type: DataTypes.ENUM('stripe'),
      defaultValue: 'stripe',
    },
    { transaction },
  );

  logger.info('Add column `vatIdNumber` to table `Organization`');
  await queryInterface.addColumn(
    'Organization',
    'vatIdNumber',
    {
      type: DataTypes.STRING,
      allowNull: true,
    },
    { transaction },
  );

  logger.info('Add column `invoiceReference` to table `Organization`');
  await queryInterface.addColumn(
    'Organization',
    'invoiceReference',
    {
      type: DataTypes.STRING,
      allowNull: true,
    },
    { transaction },
  );

  logger.info('Add column `streetName` to table `Organization`');
  await queryInterface.addColumn(
    'Organization',
    'streetName',
    {
      type: DataTypes.STRING,
      allowNull: true,
    },
    { transaction },
  );

  logger.info('Add column `houseNumber` to table `Organization`');
  await queryInterface.addColumn(
    'Organization',
    'houseNumber',
    {
      type: DataTypes.STRING,
      allowNull: true,
    },
    { transaction },
  );

  logger.info('Add column `city` to table `Organization`');
  await queryInterface.addColumn(
    'Organization',
    'city',
    {
      type: DataTypes.STRING(85),
      allowNull: true,
    },
    { transaction },
  );

  logger.info('Add column `zipCode` to table `Organization`');
  await queryInterface.addColumn(
    'Organization',
    'zipCode',
    {
      type: DataTypes.STRING(15),
      allowNull: true,
    },
    { transaction },
  );

  logger.info('Add column `countryCode` to table `Organization`');
  await queryInterface.addColumn(
    'Organization',
    'countryCode',
    {
      type: DataTypes.STRING(2),
      allowNull: true,
    },
    { transaction },
  );

  logger.info('Add column `stripeCustomerId` to table `Organization`');
  await queryInterface.addColumn(
    'Organization',
    'stripeCustomerId',
    {
      type: DataTypes.STRING,
      allowNull: true,
    },
    { transaction },
  );

  logger.info('Add column `stripeApiSecretKey` to `App` table');
  await queryInterface.addColumn(
    'App',
    'stripeApiSecretKey',
    {
      type: DataTypes.BLOB,
      allowNull: true,
    },
    { transaction },
  );

  logger.info('Add column `stripeWebhookSecret` to `App` table');
  await queryInterface.addColumn(
    'App',
    'stripeWebhookSecret',
    {
      type: DataTypes.BLOB,
      allowNull: true,
    },
    { transaction },
  );

  logger.info('Add column `CancelUrl` to `App` table');
  await queryInterface.addColumn(
    'App',
    'cancelUrl',
    {
      type: DataTypes.STRING,
      allowNull: true,
    },
    { transaction },
  );

  logger.info('Add column `SuccessUrl` to `App` table');
  await queryInterface.addColumn(
    'App',
    'successUrl',
    {
      type: DataTypes.STRING,
      allowNull: true,
    },
    { transaction },
  );
}

/**
 * Summary:
 * - Drop table `invoice`
 * - Drop table `organizationSubscription`
 * - Drop table `coupon`
 * - Remove columns preferredPaymentProvider, vatIdNumber, streetName, houseNumber,
 * city, zipCode, country, invoiceReference, stripeCustomerId
 * from table `Organization`
 * - Remove columns stripeApiSecretKey, stripeWebhookSecret, cancelUrl and successUrl from table
 * `App`
 *
 * @param transaction The sequelize Transaction.
 * @param db The sequelize database.
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Drop table `InvoiceTransaction`');
  await queryInterface.dropTable('InvoiceTransaction', { transaction });

  logger.info('Drop table `Invoice`');
  await queryInterface.dropTable('Invoice', { transaction });

  logger.info('Drop table `OrganizationSubscription`');
  await queryInterface.dropTable('OrganizationSubscription', { transaction });

  logger.info('Drop table `Coupon`');
  await queryInterface.dropTable('Coupon', { transaction });

  logger.info('Remove column preferredPaymentProvider from `Organization` table');
  await queryInterface.removeColumn('Organization', 'preferredPaymentProvider', { transaction });

  logger.info('Remove column vatIdNumber from `Organization` table');
  await queryInterface.removeColumn('Organization', 'vatIdNumber', { transaction });

  logger.info('Remove column streetName from `Organization` table');
  await queryInterface.removeColumn('Organization', 'streetName', { transaction });

  logger.info('Remove column houseNumber from `Organization` table');
  await queryInterface.removeColumn('Organization', 'houseNumber', { transaction });

  logger.info('Remove column city from `Organization` table');
  await queryInterface.removeColumn('Organization', 'city', { transaction });

  logger.info('Remove column zipCode from `Organization` table');
  await queryInterface.removeColumn('Organization', 'zipCode', { transaction });

  logger.info('Remove column countryCode from `Organization` table');
  await queryInterface.removeColumn('Organization', 'countryCode', { transaction });

  logger.info('Remove column invoiceReference from `Organization` table');
  await queryInterface.removeColumn('Organization', 'invoiceReference', { transaction });

  logger.info('Remove column stripeCustomerId from `Organization` table');
  await queryInterface.removeColumn('Organization', 'stripeCustomerId', { transaction });

  logger.info('Remove column stripeApiSecretKey from `App` table');
  await queryInterface.removeColumn('App', 'stripeApiSecretKey', { transaction });

  logger.info('Remove column stripeWebhookSecret from `App` table');
  await queryInterface.removeColumn('App', 'stripeWebhookSecret', { transaction });

  logger.info('Remove column SuccessUrl from `App` table');
  await queryInterface.removeColumn('App', 'successUrl', { transaction });

  logger.info('Remove column CancelUrl from `App` table');
  await queryInterface.removeColumn('App', 'cancelUrl', { transaction });
}
