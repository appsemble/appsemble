import { logger } from '@appsemble/node-utils';
import nodemailer, { Transporter } from 'nodemailer';
import type { Options } from 'nodemailer/lib/smtp-connection';

import type { Argv } from '../../types';
import renderEmail from './renderEmail';

export interface Recipient {
  /**
   * The email address of the recipient.
   */
  email: string;

  /**
   * The name of the recipient.
   */
  name?: string;
}

/**
 * A class to simplify sending emails.
 */
export default class Mailer {
  transport: Transporter;

  /**
   * @param {Object} argv The CLI arguments passed to the Appsemble server.
   */
  constructor({ smtpFrom, smtpHost, smtpPass, smtpPort, smtpSecure, smtpUser }: Argv) {
    if (smtpHost) {
      const auth = (smtpUser && smtpPass && { user: smtpUser, pass: smtpPass }) || null;
      this.transport = nodemailer.createTransport(
        {
          port: smtpPort || smtpSecure ? 465 : 587,
          pool: true,
          host: smtpHost,
          secure: smtpSecure,
          auth,
        } as Options,
        { from: smtpFrom },
      );
    }
  }

  /**
   * Check if the SMTP connection still works
   *
   * @throws If the SMTP connection no longer works.
   */
  async verify(): Promise<void> {
    if (!this.transport) {
      logger.warn('SMTP hasn’t been configured.');
      return;
    }
    await this.transport.verify();
  }

  /**
   * Send an email using the configured SMTP transport.
   *
   * @param to The email
   * @param templateName The name of the Markdown email template to send
   * @param values A key/value pair of values to use for rendering the email.
   */
  async sendEmail(
    to: Recipient,
    templateName: string,
    values: { [key: string]: string },
  ): Promise<void> {
    const { html, subject, text } = await renderEmail(templateName, {
      ...values,
      greeting: to.name ? `Hello ${to.name}` : 'Hello',
    });
    if (!this.transport) {
      logger.warn('SMTP hasn’t been configured. Not sending real email.');
    }
    const stringTo = to.name ? `${to.name} <${to.email}>` : to.email;
    logger.info(`Sending email:\nTo: ${stringTo}\nSubject: ${subject}\n\n${text}`);
    if (this.transport) {
      await this.transport.sendMail({ html, subject, text, to: stringTo });
    }
    logger.verbose('Email sent succesfully.');
  }
}
