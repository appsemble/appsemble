import { assertKoaError } from '@appsemble/node-utils';
import { InvoiceStatus } from '@appsemble/types';
import dayjs from 'dayjs';
import { type Context } from 'koa';
import { type SendMailOptions } from 'nodemailer';
import Stripe from 'stripe';

import {
  InvoiceTransaction,
  Organization,
  OrganizationSubscription,
} from '../../../models/index.js';
import { Invoice } from '../../../models/Invoice.js';
import { argv } from '../../../utils/argv.js';
import { Mailer } from '../../../utils/email/Mailer.js';

export async function acceptPayment(ctx: Context): Promise<void> {
  const stripe = new Stripe(argv.stripeApiKey);
  const mailer = new Mailer(argv);

  const event = ctx.request.body;

  if (
    (event.type === 'invoice.paid' ||
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded') &&
    event?.data?.object?.metadata?.id
  ) {
    const invoice = await Invoice.findByPk(event.data.object.metadata.id);
    assertKoaError(!invoice, ctx, 404, 'Invoice not found.');
    invoice!.invoiceStatus = InvoiceStatus.Paid;
    invoice!.save();

    const subscription = await OrganizationSubscription.findByPk(invoice!.subscriptionId);
    assertKoaError(!subscription, ctx, 404, 'Subscription not found.');
    subscription!.expirationDate = dayjs().add(1, 'month').toDate();
    subscription!.subscriptionPlan = invoice!.subscriptionPlan;
    subscription!.cancelled = false;
    subscription!.cancelledAt = undefined;
    subscription!.save();
    const transaction = await InvoiceTransaction.create({
      InvoiceId: event?.data?.object?.metadata?.id,
      timestamp: Date.now(),
      status: event.type,
    });
    transaction.save();
    const organization = await Organization.findByPk(invoice!.organizationId);
    assertKoaError(!(organization && organization?.email), ctx, 404, 'Organization not found.');
    const attachments: SendMailOptions['attachments'] = [];
    attachments.push({
      filename: 'Invoice.pdf',
      content: invoice!.pdfInvoice,
      contentType: 'application/pdf',
    });
    mailer.sendTranslatedEmail({
      to: {
        name: organization!.name,
        email: organization!.email!,
      },
      emailName: 'subscriptionConfirmation',
      attachments,
      locale: 'EN',
      values: {
        name: organization!.name,
      },
    });
  } else {
    if (
      event.type === 'invoice.payment_failed' &&
      event?.data?.object?.metadata?.initial !== 'true'
    ) {
      const invoice = await Invoice.findByPk(event.data.object.metadata.id);
      assertKoaError(!invoice, ctx, 404, 'Invoice not found.');

      const organization = await Organization.findByPk(invoice!.organizationId);
      assertKoaError(!(organization && organization?.email), ctx, 404, 'Organization not found.');
      const attachments: SendMailOptions['attachments'] = [];
      attachments.push({
        filename: 'Invoice.pdf',
        content: invoice!.pdfInvoice,
        contentType: 'application/pdf',
      });
      mailer.sendTranslatedEmail({
        to: {
          name: organization!.name,
          email: organization!.email!,
        },
        emailName: 'subscriptionChargeFailed',
        attachments,
        locale: 'EN',
        values: {
          name: organization!.name,
          link: (text) => `[${text}](${event?.data?.object?.hosted_invoice_url})`,
        },
      });

      const paymentIntent = await stripe.paymentIntents.retrieve(
        event.data?.object?.payment_intent,
      );
      if (
        paymentIntent?.last_payment_error?.code === 'charge_exceeds_source_limit' ||
        paymentIntent?.last_payment_error?.code === 'charge_exceeds_transaction_limit'
      ) {
        const transaction = await InvoiceTransaction.findOne({
          where: { InvoiceId: event.data.object.metadata.id },
        });
        invoice!.invoiceStatus = transaction ? InvoiceStatus.Failed : InvoiceStatus.Retry;
        invoice!.save();
      } else {
        invoice!.invoiceStatus = InvoiceStatus.Failed;
        invoice!.save();
      }
      const transaction = await InvoiceTransaction.create({
        InvoiceId: event?.data?.object?.metadata?.id,
        timestamp: Date.now(),
        status: paymentIntent?.last_payment_error?.code || 'unknown',
      });
      transaction.save();
    }
  }

  ctx.body = {};
}
