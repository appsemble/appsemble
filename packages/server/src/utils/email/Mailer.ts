import { logger } from '@appsemble/node-utils';
import { createTransport, Transporter } from 'nodemailer';
import type { Options } from 'nodemailer/lib/smtp-connection';

import type { Argv } from '../../types';
import { readAsset } from '../readAsset';
import { renderEmail } from './renderEmail';

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
export class Mailer {
  transport: Transporter;

  /**
   * @param argv - The CLI arguments passed to the Appsemble server.
   */
  constructor({ smtpFrom, smtpHost, smtpPass, smtpPort, smtpSecure, smtpUser }: Argv) {
    if (smtpHost) {
      const auth = (smtpUser && smtpPass && { user: smtpUser, pass: smtpPass }) || null;
      this.transport = createTransport(
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
   * @param to - The email
   * @param templateName - The name of the Markdown email template to send
   * @param values - A key/value pair of values to use for rendering the email.
   */
  async sendTemplateEmail(
    to: Recipient,
    templateName: string,
    values: { [key: string]: string },
  ): Promise<void> {
    const template = (await readAsset(`email/${templateName}.md`, 'utf-8')) as string;
    const { html, subject, text } = await renderEmail(template, {
      ...values,
      greeting: to.name ? `Hello ${to.name}` : 'Hello',
    });

    return this.sendEmail(to.name ? `${to.name} <${to.email}>` : to.email, subject, html, text);
  }

  /**
   * Send an email using the configured SMTP transport.
   *
   * @param to - The email address of the recipient
   * @param subject - The subject of the email
   * @param html - The HTML content of the email
   * @param text - The plain-text content of the email
   */
  async sendEmail(to: string, subject: string, html: string, text: string): Promise<void> {
    if (!this.transport) {
      logger.warn('SMTP hasn’t been configured. Not sending real email.');
    }
    logger.info(`Sending email:\nTo: ${to}\nSubject: ${subject}\n\n${text}`);
    if (this.transport) {
      await this.transport.sendMail({ html, subject, text, to });
    }
    logger.verbose('Email sent succesfully.');
  }
}
