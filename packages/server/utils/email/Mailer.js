import { logger } from '@appsemble/node-utils';
import nodemailer from 'nodemailer';

import renderEmail from './renderEmail';

/**
 * A class to simplify sending emails.
 */
export default class Mailer {
  /**
   * @param {Object} argv The CLI arguments passed to the Appsemble server.
   */
  constructor({ smtpFrom, smtpHost, smtpPass, smtpPort, smtpSecure, smtpUser }) {
    if (smtpHost) {
      const auth = (smtpUser && smtpPass && { user: smtpUser, pass: smtpPass }) || null;
      this.transport = nodemailer.createTransport({
        port: smtpPort || smtpSecure ? 465 : 587,
        pool: true,
        host: smtpHost,
        secure: smtpSecure,
        from: smtpFrom,
        auth,
      });
    }
  }

  /**
   * Check if the SMTP connection still works
   *
   * @throws If the SMTP connection no longer works.
   */
  async verify() {
    if (!this.transport) {
      logger.warn('SMTP hasn’t been configured.');
      return;
    }
    await this.transport.verify();
  }

  /**
   * Send an email using the configured SMTP transport.
   *
   * @param {Object} to
   * @param {string} to.email The email address to send the email to.
   * @param {string} to.name The name of the recipient.
   * @param {string} templateName The name of the Markdown email template to send
   * @param {Object} values A key/value pair of values to use for rendering the email.
   */
  async sendEmail(to, templateName, values) {
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
