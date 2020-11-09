import { logger } from '@appsemble/node-utils';
import { createTransport, SendMailOptions as MailerSendMailOptions, Transporter } from 'nodemailer';
import { Options } from 'nodemailer/lib/smtp-connection';

import { Argv } from '../../types';
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

export interface SendMailOptions {
  /**
   * The email address of the recipient
   */
  to?: string;

  /**
   * The email address(es) to BCC the mail to.
   */
  cc?: string | string[];

  /**
   * The email address(es) to BCC the mail to.
   */
  bcc?: string | string[];

  /**
   * The subject of the email.
   */
  subject: string;

  /**
   * The HTML content of the email.
   */
  html: string;

  /**
   * The plain-text content of the email.
   */
  text: string;

  /**
   * The attachments to include in the email.
   */
  attachments?: MailerSendMailOptions['attachments'];
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
    values: Record<string, string>,
  ): Promise<void> {
    const template = (await readAsset(`email/${templateName}.md`, 'utf-8')) as string;
    const { html, subject, text } = await renderEmail(template, {
      ...values,
      greeting: to.name ? `Hello ${to.name}` : 'Hello',
    });

    return this.sendEmail({
      to: to.name ? `${to.name} <${to.email}>` : to.email,
      subject,
      html,
      text,
    });
  }

  /**
   * Send an email using the configured SMTP transport.
   *
   * @param options - The options specifying the contents and metadata of the email
   */
  async sendEmail({
    to,
    cc,
    bcc,
    subject,
    html,
    text,
    attachments = [],
  }: SendMailOptions): Promise<void> {
    if (!this.transport) {
      logger.warn('SMTP hasn’t been configured. Not sending real email.');
    }
    logger.info(
      `Sending email:\nTo: ${to} | CC: ${cc} | BCC: ${bcc}\nSubject: ${subject}\n\n${text}`,
    );

    if (attachments.length) {
      logger.info(
        `Including ${attachments.length} attachments: ${JSON.stringify(
          attachments.map((a) => a.path || a.filename),
        )}`,
      );
    }
    if (this.transport) {
      await this.transport.sendMail({ html, subject, text, to, attachments });
    }
    logger.verbose('Email sent succesfully.');
  }
}
