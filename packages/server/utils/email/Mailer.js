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

  async verify() {
    if (!this.transport) {
      logger.warn('SMTP hasn’t been configured.');
      return;
    }
    await this.transport.verify();
  }

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
