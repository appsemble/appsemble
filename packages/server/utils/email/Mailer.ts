import { logger } from '@appsemble/node-utils';
import {
  getAppsembleMessages,
  getSupportedLanguages,
} from '@appsemble/node-utils/getAppsembleMessages.js';
import { defaultLocale, has } from '@appsemble/utils';
import addrs, { type ParsedMailbox } from 'email-addresses';
import { type FormatXMLElementFn, IntlMessageFormat, type PrimitiveType } from 'intl-messageformat';
import tags from 'language-tags';
import {
  createTransport,
  type SendMailOptions as MailerSendMailOptions,
  type Transporter,
} from 'nodemailer';
import { type Options } from 'nodemailer/lib/smtp-transport';
import { Op } from 'sequelize';

import { renderEmail } from './renderEmail.js';
import { type App, AppMessages } from '../../models/index.js';
import { argv } from '../argv.js';
import { decrypt } from '../crypto.js';
import { readAsset } from '../readAsset.js';

const supportedLanguages = getSupportedLanguages();
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
   * The name of the email sender.
   *
   * @default 'Appsemble'
   */
  from?: string;

  /**
   * The email address(es) to BCC the mail to.
   */
  cc?: string[] | string;

  /**
   * The email address(es) to BCC the mail to.
   */
  bcc?: string[] | string;

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

  /**
   * An app containing custom SMTP settings.
   */
  app?: Pick<
    App,
    'emailHost' | 'emailName' | 'emailPassword' | 'emailPort' | 'emailSecure' | 'emailUser'
  >;
}

/**
 * A class to simplify sending emails.
 */
export class Mailer {
  transport: Transporter;

  constructor({
    smtpFrom,
    smtpHost,
    smtpPass,
    smtpPort,
    smtpSecure,
    smtpUser,
  }: Pick<
    typeof argv,
    'smtpFrom' | 'smtpHost' | 'smtpPass' | 'smtpPort' | 'smtpSecure' | 'smtpUser'
  >) {
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

  async sendTranslatedEmail({
    app,
    appId,
    emailName,
    from = 'Appsemble',
    locale = defaultLocale,
    to,
    values,
  }: {
    to: Recipient;
    appId: number;
    from?: string;
    emailName: string;
    values: Record<string, FormatXMLElementFn<string, string[] | string> | PrimitiveType>;
    locale: string;
    app?: App;
  }): Promise<void> {
    const emailLocale = locale || defaultLocale;
    const lang = emailLocale.toLowerCase();
    const baseLanguage = tags(lang)
      .subtags()
      .find((sub) => sub.type() === 'language');
    const baseLang = baseLanguage && String(baseLanguage).toLowerCase();
    const appMessages = await AppMessages.findAll({
      where: {
        AppId: appId,
        language: { [Op.or]: baseLang ? [baseLang, lang, defaultLocale] : [lang, defaultLocale] },
      },
    });

    const subjectKey = `server.emails.${emailName}.subject`;
    const bodyKey = `server.emails.${emailName}.body`;

    let templateSubject: string;
    let templateBody: string;

    const langMessages = appMessages.find((a) => a.language === lang);
    const baseLangMessages = appMessages.find((a) => a.language === baseLang);
    const defaultLocaleMessages = appMessages.find((a) => a.language === defaultLocale);

    if (
      langMessages &&
      has(langMessages.messages?.core, subjectKey) &&
      has(langMessages.messages?.core, bodyKey)
    ) {
      templateSubject = langMessages.messages.core[subjectKey];
      templateBody = langMessages.messages.core[bodyKey];
    } else if (
      baseLangMessages &&
      has(baseLangMessages.messages?.core, subjectKey) &&
      has(baseLangMessages.messages?.core, bodyKey)
    ) {
      templateSubject = baseLangMessages.messages.core[subjectKey];
      templateBody = baseLangMessages.messages.core[bodyKey];
    } else if (
      defaultLocaleMessages &&
      has(defaultLocaleMessages.messages?.core, subjectKey) &&
      has(defaultLocaleMessages.messages?.core, bodyKey)
    ) {
      templateSubject = defaultLocaleMessages.messages.core[subjectKey];
      templateBody = defaultLocaleMessages.messages.core[bodyKey];
    } else if ((await supportedLanguages).has(baseLang) || (await supportedLanguages).has(lang)) {
      const coreMessages = await getAppsembleMessages(lang, baseLang);
      if (has(coreMessages, bodyKey) && has(coreMessages, subjectKey)) {
        templateSubject = coreMessages[subjectKey];
        templateBody = coreMessages[bodyKey];
      }
    }

    if (!templateSubject || !templateBody) {
      const messages = await getAppsembleMessages(defaultLocale);
      templateSubject = messages[subjectKey];
      templateBody = messages[bodyKey];
    }

    const sub = new IntlMessageFormat(templateSubject, emailLocale).format(values);
    const body = new IntlMessageFormat(templateBody, emailLocale).format(values);

    const { html, subject, text } = await renderEmail(body as string, {}, sub as string);

    const email = {
      to: to.name ? `${to.name} <${to.email}>` : to.email,
      from: from || 'Appsemble',
      subject,
      html,
      text,
    };

    if (app?.emailHost && app?.emailUser && app?.emailPassword) {
      const smtpPass = decrypt(app.emailPassword, argv.aesSecret);
      const mailer = new Mailer({
        smtpFrom: from,
        smtpHost: app.emailHost,
        smtpPass,
        smtpPort: app.emailPort,
        smtpSecure: app.emailSecure,
        smtpUser: app.emailUser,
      });

      await mailer.sendEmail(email);
      return;
    }

    await this.sendEmail(email);
  }

  /**
   * Send an email using the configured SMTP transport.
   *
   * @param to The email
   * @param templateName The name of the Markdown email template to send
   * @param values A key/value pair of values to use for rendering the email.
   */
  async sendTemplateEmail(
    to: Recipient,
    templateName: string,
    values: Record<string, string>,
  ): Promise<void> {
    const template = await readAsset(`email/${templateName}.md`, 'utf8');
    const { html, subject, text } = await renderEmail(template, {
      ...values,
      greeting: to.name ? `Hello ${to.name}` : 'Hello',
    });

    await this.sendEmail({
      to: to.name ? `${to.name} <${to.email}>` : to.email,
      subject,
      html,
      text,
    });
  }

  /**
   * Send an email using the configured SMTP transport.
   *
   * @param options The options specifying the contents and metadata of the email
   */
  async sendEmail({
    app,
    attachments = [],
    bcc,
    cc,
    from,
    html,
    subject,
    text,
    to,
  }: SendMailOptions): Promise<void> {
    let { transport } = this;
    if (app?.emailHost && app?.emailUser && app?.emailPassword) {
      const smtpPass = decrypt(app.emailPassword, argv.aesSecret);
      const mailer = new Mailer({
        smtpFrom: from,
        smtpHost: app.emailHost,
        smtpPass,
        smtpPort: app.emailPort,
        smtpSecure: app.emailSecure,
        smtpUser: app.emailUser,
      });

      ({ transport } = mailer);
    }

    if (!transport) {
      logger.warn('SMTP hasn’t been configured. Not sending real email.');
    }
    const parsed = addrs.parseOneAddress(argv.smtpFrom) as ParsedMailbox;
    const fromHeader = from ? `${from} <${parsed?.address}>` : argv.smtpFrom;

    const loggingMessage = ['Sending email:', `To: ${to}`];
    if (cc) {
      loggingMessage.push(`CC: ${cc}`);
    }
    if (bcc) {
      loggingMessage.push(`BCC: ${bcc}`);
    }
    if (fromHeader) {
      loggingMessage.push(`From: ${fromHeader}`);
    }
    loggingMessage.push(`Subject: ${subject}`, '', text);
    logger.info(loggingMessage.join('\n'));

    if (attachments.length) {
      logger.info(
        `Including ${attachments.length} attachments: ${JSON.stringify(
          attachments.map((a) => a.path || a.filename),
        )}`,
      );
    }
    if (transport) {
      await transport.sendMail({
        html,
        from: fromHeader,
        subject,
        text,
        to,
        attachments,
      });
    }
    logger.verbose('Email sent successfully.');
  }
}
