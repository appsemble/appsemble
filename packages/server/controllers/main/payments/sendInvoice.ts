import { assertKoaError, throwKoaError } from '@appsemble/node-utils';
import {
  getSubscriptionPlanByName,
  OrganizationPermission,
  PaymentProvider,
  SubscriptionRenewalPeriod,
} from '@appsemble/types';
import { Decimal } from 'decimal.js';
import { type Context } from 'koa';

import { Organization, OrganizationSubscription } from '../../../models/index.js';
import { Invoice } from '../../../models/main/Invoice.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';
import { calculateSubscriptionPrice } from '../../../utils/calculateVat.js';
import { createInvoice } from '../../../utils/createPdfInvoice.js';
import { getPaymentObject } from '../../../utils/payments/getPaymentObject.js';

export async function sendInvoice(ctx: Context): Promise<void> {
  const {
    queryParams: { couponCode, organizationId, period, subscriptionType },
  } = ctx;

  const organization = await Organization.findByPk(organizationId);
  assertKoaError(!organization, ctx, 404, 'Organization not found.');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId,
    requiredPermissions: [OrganizationPermission.ManageOrganizationSubscriptions],
  });

  const subscription = await OrganizationSubscription.findOne({
    where: { OrganizationId: organization!.id },
  });
  assertKoaError(!subscription, ctx, 404, 'Subscription not found.');
  switch (period) {
    case 'month':
      subscription!.renewalPeriod = SubscriptionRenewalPeriod.Month;
      break;
    case 'year':
      subscription!.renewalPeriod = SubscriptionRenewalPeriod.Year;
      break;
    default:
      subscription!.renewalPeriod = SubscriptionRenewalPeriod.Month;
      break;
  }
  subscription!.save();

  const wantedPlan = getSubscriptionPlanByName(subscriptionType);
  const pricingInformation = await calculateSubscriptionPrice(
    wantedPlan,
    subscription!,
    period,
    organization!.countryCode!,
    organization!.vatIdNumber,
    couponCode,
  );
  assertKoaError(!pricingInformation, ctx, 404, 'Something went wrong with the pricing.');
  let invoice: Invoice;

  const transaction = await Invoice.sequelize?.transaction();
  try {
    invoice = await Invoice.create(
      {
        subscriptionId: subscription!.id,
        organizationId: organization!.id,
        reference: organization!.invoiceReference,
        amount: pricingInformation!.priceWithCoupon,
        vatIdNumber: organization!.vatIdNumber,
        vatPercentage: new Decimal(pricingInformation!.vatPercentage).times(100).toNumber(),
        customerName: organization!.name,
        subscriptionPlan: subscriptionType,
        customerStreetName: organization!.streetName,
        customerHouseNumber: organization!.houseNumber,
        customerCity: organization!.city,
        customerZipCode: organization!.zipCode,
        customerCountryCode: organization!.countryCode,
        kvkNumber: 123,
        serviceSupplied: subscriptionType,
        activationDate: new Date(),
        invoiceNumberPrefix: 'test',
      },
      { transaction },
    );
    invoice.pdfInvoice = Buffer.from(await createInvoice(invoice, organization?.locale));
    await invoice.save({ transaction });
    await transaction!.commit();
  } catch {
    if (transaction) {
      await transaction.rollback();
    }
    throwKoaError(ctx, 500, 'Something went wrong while creating invoice.');
  }
  assertKoaError(!invoice, ctx, 500, 'Problem creating invoice.');

  const payments = await getPaymentObject(PaymentProvider.Stripe);

  const stripeCustomerId = await payments.createOrUpdateCustomer(organization!);
  assertKoaError(!stripeCustomerId, ctx, 500, 'Problem creating customer.');
  organization!.stripeCustomerId = stripeCustomerId;
  organization!.save();

  const invoiceInformation = await payments.createInvoice(
    invoice,
    organization,
    subscription!.renewalPeriod,
    true,
  );
  assertKoaError(!invoiceInformation, ctx, 500, 'Problem creating invoice.');
  invoice.stripeInvoiceId = invoiceInformation.id;
  invoice.save();

  ctx.body = {
    url: invoiceInformation.paymentUrl,
  };
}
