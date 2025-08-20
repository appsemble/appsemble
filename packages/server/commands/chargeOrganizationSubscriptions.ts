import { logger } from '@appsemble/node-utils';
import { getSubscriptionPlanByName, InvoiceStatus, PaymentProvider } from '@appsemble/types';
import dayjs from 'dayjs';
import { Decimal } from 'decimal.js';
import { Op, type Sequelize } from 'sequelize';
import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import { getExpiringOrganizationSubscriptions } from './getExpiringOrganizationSubscriptions.js';
import { initDB, Organization } from '../models/index.js';
import { Invoice } from '../models/Invoice.js';
import { argv } from '../utils/argv.js';
import { calculateSubscriptionPrice } from '../utils/calculateVat.js';
import { createInvoice } from '../utils/createPdfInvoice.js';
import { Mailer } from '../utils/email/Mailer.js';
import { getPaymentObject } from '../utils/payments/getPaymentObject.js';
import { type Payments } from '../utils/payments/payments.js';
import { handleDBError } from '../utils/sqlUtils.js';

export const command = 'charge-organization-subscriptions';
export const description =
  'Charges subscriptions expiring on todays date, sends email notifications for subscriptions expiring in two days and retries payments failed a week ago.';

export function builder(yargs: Argv): Argv {
  return databaseBuilder(yargs);
}
export async function chargeOrganizationSubscriptions(
  existingMailer?: Mailer | null,
  existingPayments?: Payments,
): Promise<void> {
  logger.info('script started');
  const chargeDaysInAdvance = 14;
  const chargeSubscriptions = await getExpiringOrganizationSubscriptions(chargeDaysInAdvance);
  logger.info('charge subscriptions:', chargeSubscriptions);
  const notifySubscriptions = await getExpiringOrganizationSubscriptions(chargeDaysInAdvance + 2);
  const payments = existingPayments || (await getPaymentObject(PaymentProvider.Stripe));
  const mailer = existingMailer || new Mailer(argv);

  const startDate = dayjs().subtract(1, 'month');
  const failedInvoices = await Invoice.findAll({
    where: { invoiceStatus: InvoiceStatus.Retry, created: { [Op.gt]: String(startDate) } },
  });

  for (const invoice of failedInvoices) {
    await payments.chargeInvoice(invoice.stripeInvoiceId!);
    await invoice.update({ invoiceStatus: InvoiceStatus.Pending });
  }

  for (const subscription of chargeSubscriptions) {
    const organization = await Organization.findOne({ where: { id: subscription.OrganizationId } });
    const pricingInformation = await calculateSubscriptionPrice(
      getSubscriptionPlanByName(subscription.subscriptionPlan!),
      subscription,
      subscription.renewalPeriod!,
      organization!.countryCode!,
      organization?.vatIdNumber,
    );
    let invoice: Invoice;

    const transaction = await Invoice.sequelize?.transaction();
    try {
      invoice = await Invoice.create(
        {
          subscriptionId: subscription.id,
          organizationId: organization!.id,
          reference: organization!.invoiceReference,
          amount: pricingInformation!.basePrice,
          vatIdNumber: organization!.vatIdNumber,
          vatPercentage: String(new Decimal(pricingInformation!.vatPercentage).mul(100)),
          customerName: organization!.name,
          subscriptionPlan: subscription.subscriptionPlan,
          customerStreetName: organization!.streetName,
          customerHouseNumber: organization!.houseNumber,
          customerCity: organization!.city,
          customerZipCode: organization!.zipCode,
          customerCountryCode: organization!.countryCode,
          kvkNumber: 123,
          serviceSupplied: subscription.subscriptionPlan,
          activationDate: new Date(),
          invoiceNumberPrefix: 'test',
        },
        { transaction },
      );
      invoice.pdfInvoice = Buffer.from(await createInvoice(invoice));
      await invoice.save({ transaction });
      await transaction!.commit();
    } catch {
      logger.info('Something went wrong while creating invoice.');
      if (transaction) {
        await transaction.rollback();
      }
    }

    const stripeCustomerId = await payments.createOrUpdateCustomer(organization!);
    organization!.stripeCustomerId = stripeCustomerId;
    organization!.update({ stripeCustomerId });

    const invoiceInformation = await payments.createInvoice(
      invoice!,
      organization,
      subscription.renewalPeriod!,
    );
    invoice!.stripeInvoiceId = invoiceInformation.id;
    invoice!.update({ stripeInvoiceId: invoiceInformation.id });
    await payments.chargeInvoice(invoiceInformation.id);
  }

  for (const subscription of notifySubscriptions) {
    const organization = await Organization.findByPk(subscription.OrganizationId);
    if (organization!.email) {
      await mailer.sendTranslatedEmail({
        to: {
          name: organization!.name,
          email: organization!.email,
        },
        emailName: 'subscriptionNotice',
        locale: 'EN',
        values: {
          name: organization!.name,
        },
      });
    }
  }
}

export async function handler(): Promise<void> {
  logger.info('start of subscription charging');
  let db: Sequelize;
  try {
    db = initDB({
      host: argv.databaseHost,
      port: argv.databasePort,
      username: argv.databaseUser,
      password: argv.databasePassword,
      database: argv.databaseName,
      ssl: argv.databaseSsl,
      uri: argv.databaseUrl,
    });
  } catch (error: unknown) {
    handleDBError(error as Error);
  }

  await chargeOrganizationSubscriptions();

  logger.info('Charged subscriptions and failed payments and sent email notifications.');

  await db.close();
  process.exit();
}
