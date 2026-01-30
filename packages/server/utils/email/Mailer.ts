import {
  EmailError,
  EmailQuotaExceededError,
  getAppsembleMessages,
  getSupportedLanguages,
  logger,
} from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { defaultLocale, has } from '@appsemble/utils';
import { startOfDay } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz';
import addrs, { type ParsedMailbox } from 'email-addresses';
import { ImapFlow } from 'imapflow';
import { type FormatXMLElementFn, IntlMessageFormat, type PrimitiveType } from 'intl-messageformat';
import tags from 'language-tags';
import {
  createTransport,
  type SendMailOptions as MailerSendMailOptions,
  type Transporter,
} from 'nodemailer';
import MailComposer from 'nodemailer/lib/mail-composer/index.js';
import { type Options } from 'nodemailer/lib/smtp-transport';
import { Op } from 'sequelize';

import { renderEmail } from './renderEmail.js';
import {
  App,
  AppEmailQuotaLog,
  AppMessages,
  Organization,
  OrganizationMember,
  transactional,
  User,
} from '../../models/index.js';
import { argv } from '../argv.js';
import { decrypt } from '../crypto.js';

const supportedLanguages = getSupportedLanguages();

const emailErrorMessages: Record<string, string> = {
  EENVELOPE: 'Unable to determine the sender or recipient of the message.',
  EENVELOPEFORMAT: 'The format of the sender or recipient email address is invalid.',
  EENCODE: 'Unable to encode the message content correctly.',
  EMESSAGEID: 'Unable to generate a unique message ID.',
  ETXTBSY: 'The message file is locked by another process.',
  EFILE: 'Unable to access the message file.',
  ECONNECTION: 'Unable to establish a connection to the email server.',
  EAUTH: 'Authentication failed during the attempt to connect to the email server.',
  ENOAUTH: 'No authentication credentials were provided for the connection to the email server.',
  ETLS: 'Unable to start a TLS connection with the email server.',
  ESTARTTLS: 'Unable to start STARTTLS during the connection to the email server.',
  EUPGRADE: 'Unable to upgrade the TLS connection to a secure connection.',
  EENOTFOUND: 'Unable to find the specified email server.',
  EENOTEMPTY: 'Unable to send an empty message.',
  EMSGBIG: 'The message is too large to be sent.',
  EINVALIDDATE: 'The message date is not valid or not in the correct format.',
  ETOOMANYTOS: 'Too many recipients specified in the message.',
  ETOOMANYMSGS: 'Too many messages sent in a single call to Nodemailer.',
};

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
    | 'demoMode'
    | 'emailHost'
    | 'emailName'
    | 'emailPassword'
    | 'emailPort'
    | 'emailSecure'
    | 'emailUser'
    | 'id'
  >;
}

type MailerArgs = Partial<
  Pick<
    typeof argv,
    | 'imapCopyToSentFolder'
    | 'imapHost'
    | 'imapPass'
    | 'imapPort'
    | 'imapSecure'
    | 'imapUser'
    | 'smtpFrom'
    | 'smtpHost'
    | 'smtpPass'
    | 'smtpPort'
    | 'smtpSecure'
    | 'smtpUser'
  >
>;

/**
 * A class to simplify sending emails.
 */
export class Mailer {
  // @ts-expect-error 2564 Property ... has no initializer and is not definitely assigned in the
  // constructor
  transport: Transporter;

  // @ts-expect-error 2564 Property ... has no initializer and is not definitely assigned in the
  // constructor
  connection: boolean;

  // @ts-expect-error 2564 Property ... has no initializer and is not definitely assigned in the
  // constructor
  private imapHost: string;

  // @ts-expect-error 2564 Property ... has no initializer and is not definitely assigned in the
  // constructor
  private imapPass: string;

  // @ts-expect-error 2564 Property ... has no initializer and is not definitely assigned in the
  // constructor
  private imapPort: number;

  // @ts-expect-error 2564 Property ... has no initializer and is not definitely assigned in the
  // constructor
  private imapSecure: boolean;

  // @ts-expect-error 2564 Property ... has no initializer and is not definitely assigned in the
  // constructor
  private imapUser: string;

  constructor({
    imapHost,
    imapPass,
    imapPort,
    imapSecure,
    imapUser,
    smtpFrom,
    smtpHost,
    smtpPass,
    smtpPort,
    smtpSecure,
    smtpUser,
  }: MailerArgs) {
    if (smtpHost) {
      const auth = (smtpUser && smtpPass && { user: smtpUser, pass: smtpPass }) || null;
      this.transport = createTransport(
        {
          port: smtpPort || (smtpSecure ? 465 : 587),
          pool: true,
          host: smtpHost,
          secure: smtpSecure,
          auth,
          ...(logger.isVerboseEnabled() ? { debug: true, logger: true } : {}),
        } as Options,
        { from: smtpFrom },
      );
    }
    if (imapHost) {
      this.imapHost = imapHost;
      // @ts-expect-error 2322 undefined is not assignable to type (strictNullChecks)
      this.imapPass = imapPass;
      this.imapPort = imapPort || 993;
      this.imapSecure = imapSecure ?? false;
      // @ts-expect-error 2322 undefined is not assignable to type (strictNullChecks)
      this.imapUser = imapUser;
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
    attachments = [],
    emailName,
    from = 'Appsemble',
    locale = defaultLocale,
    to,
    values,
  }: {
    to: Recipient;
    appId?: number;
    attachments?: object[];
    from?: string;
    emailName: string;
    values: Record<string, FormatXMLElementFn<string, string[] | string> | PrimitiveType>;
    locale?: string;
    app?: App;
  }): Promise<void> {
    const emailLocale = locale || defaultLocale;
    const lang = emailLocale.toLowerCase();
    const baseLanguage = tags(lang)
      .subtags()
      .find((sub) => sub.type() === 'language');
    const baseLang = baseLanguage && String(baseLanguage).toLowerCase();
    const appMessages = appId
      ? await AppMessages.findAll({
          where: {
            AppId: appId,
            language: {
              [Op.or]: baseLang ? [baseLang, lang, defaultLocale] : [lang, defaultLocale],
            },
          },
        })
      : [];

    let templateSubject: string | undefined;
    let templateBody: string | undefined;

    const appSubjectKey = `emails.${emailName}.subject`;
    const appBodyKey = `emails.${emailName}.body`;

    const langMessages = appMessages.find((a) => a.language === lang);
    const baseLangMessages = appMessages.find((a) => a.language === baseLang);
    const defaultLocaleMessages = appMessages.find((a) => a.language === defaultLocale);

    if (
      langMessages &&
      has(langMessages.messages?.app, appSubjectKey) &&
      has(langMessages.messages?.app, appBodyKey)
    ) {
      templateSubject = langMessages.messages?.app[appSubjectKey];
      templateBody = langMessages.messages?.app[appBodyKey];
    } else if (
      baseLangMessages &&
      has(baseLangMessages.messages?.app, appSubjectKey) &&
      has(baseLangMessages.messages?.app, appBodyKey)
    ) {
      templateSubject = baseLangMessages.messages?.app[appSubjectKey];
      templateBody = baseLangMessages.messages?.app[appBodyKey];
    } else if (
      defaultLocaleMessages &&
      has(defaultLocaleMessages.messages?.app, appSubjectKey) &&
      has(defaultLocaleMessages.messages?.app, appBodyKey)
    ) {
      templateSubject = defaultLocaleMessages.messages?.app[appSubjectKey];
      templateBody = defaultLocaleMessages.messages?.app[appBodyKey];
    }

    const coreSubjectKey = `server.emails.${emailName}.subject`;
    const coreBodyKey = `server.emails.${emailName}.body`;

    if (!templateSubject || !templateBody) {
      if (
        langMessages &&
        has(langMessages.messages?.core, coreSubjectKey) &&
        has(langMessages.messages?.core, coreBodyKey)
      ) {
        templateSubject = langMessages.messages?.core[coreSubjectKey];
        templateBody = langMessages.messages?.core[coreBodyKey];
      } else if (
        baseLangMessages &&
        has(baseLangMessages.messages?.core, coreSubjectKey) &&
        has(baseLangMessages.messages?.core, coreBodyKey)
      ) {
        templateSubject = baseLangMessages.messages?.core[coreSubjectKey];
        templateBody = baseLangMessages.messages?.core[coreBodyKey];
      } else if (
        defaultLocaleMessages &&
        has(defaultLocaleMessages.messages?.core, coreSubjectKey) &&
        has(defaultLocaleMessages.messages?.core, coreBodyKey)
      ) {
        templateSubject = defaultLocaleMessages.messages?.core[coreSubjectKey];
        templateBody = defaultLocaleMessages.messages?.core[coreBodyKey];
        // @ts-expect-error 2322 undefined is not assignable to type (strictNullChecks)
      } else if ((await supportedLanguages).has(baseLang) || (await supportedLanguages).has(lang)) {
        const coreMessages = await getAppsembleMessages(lang, baseLang);
        if (has(coreMessages, coreBodyKey) && has(coreMessages, coreSubjectKey)) {
          templateSubject = coreMessages[coreSubjectKey];
          templateBody = coreMessages[coreBodyKey];
        }
      }
    }

    if (!templateSubject || !templateBody) {
      const messages = await getAppsembleMessages(defaultLocale);
      templateSubject = messages[coreSubjectKey];
      templateBody = messages[coreBodyKey];
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
      app: app ? { ...app, id: app.id ?? appId } : undefined,
      attachments,
    };

    await this.sendEmail(email);
  }

  async tryRateLimiting({ app }: Pick<SendMailOptions, 'app'>): Promise<void> {
    if (
      argv.enableAppEmailQuota &&
      app &&
      !(app?.emailHost && app?.emailUser && app?.emailPassword)
    ) {
      const todayStartUTC = zonedTimeToUtc(startOfDay(new Date()), 'UTC');
      await transactional(async (transaction) => {
        const emailsSentToday = await AppEmailQuotaLog.count({
          where: {
            created: {
              [Op.gte]: todayStartUTC,
            },
            AppId: app.id,
          },
          transaction,
        });
        if (emailsSentToday >= argv.dailyAppEmailQuota) {
          throw new EmailQuotaExceededError('Too many emails sent today');
        }
        if (argv.enableAppEmailQuotaAlerts && emailsSentToday === argv.dailyAppEmailQuota - 1) {
          // Notify app owner(s) they’re about to exceed their quota
          const fullApp = await App.findByPk(app.id, {
            include: [Organization],
            transaction,
          });
          const members = await OrganizationMember.findAll({
            where: {
              role: PredefinedOrganizationRole.Owner,
              // @ts-expect-error 18048 variable is possibly null (strictNullChecks)
              OrganizationId: fullApp.OrganizationId,
            },
            include: [
              {
                model: User,
                required: true,
                attributes: ['primaryEmail', 'name', 'locale'],
              },
            ],
            attributes: [],
            transaction,
          });
          await Promise.all(
            members.map(async (m) => {
              await this.sendTranslatedEmail({
                to: {
                  name: m.User!.name,
                  // @ts-expect-error 2322 undefined is not assignable to type (strictNullChecks)
                  email: m.User!.primaryEmail,
                },
                emailName: 'appEmailQuotaLimitHit',
                locale: m.User!.locale,
                values: {
                  name: m.User!.name,
                  // @ts-expect-error 18048 variable is possibly null (strictNullChecks)
                  appName: fullApp.definition.name,
                },
              });
            }),
          );
        }

        await AppEmailQuotaLog.create(
          {
            AppId: app.id,
          },
          { transaction },
        );
      });
    }
  }

  /**
   * Send an email using the configured SMTP transport.
   *
   * @param options The options specifying the contents and metadata of the email
   * @throws EmailQuotaExceededError If an app has sent too many emails today
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
    const hasOwnEmail = app?.emailHost && app?.emailUser && app?.emailPassword;
    if (hasOwnEmail) {
      const smtpPass = decrypt(app.emailPassword!, argv.aesSecret);
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

    await this.tryRateLimiting({ app });

    const parsed = addrs.parseOneAddress(
      hasOwnEmail ? app.emailUser! : argv.smtpFrom,
    ) as ParsedMailbox;
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
      try {
        await transport.sendMail({
          ...(cc ? { cc } : {}),
          ...(bcc ? { bcc } : {}),
          html,
          from: fromHeader,
          subject,
          text,
          to,
          attachments,
        });
      } catch (error: any) {
        throw new EmailError(
          error.message ||
            emailErrorMessages[error.code] ||
            'Something went wrong when sending the email.',
        );
      }
    }
    logger.verbose('Email sent successfully.');

    if (argv.imapCopyToSentFolder) {
      // https://stackoverflow.com/a/50310199
      const message = await new MailComposer({
        ...(cc ? { cc } : {}),
        ...(bcc ? { bcc } : {}),
        html,
        from: fromHeader,
        subject,
        text,
        to,
        attachments,
      })
        .compile()
        .build();
      if (argv.imapHost) {
        await this.copyToSentFolder(message);
      } else {
        logger.warn('IMAP hasn’t been configured. Not moving email to sent folder.');
      }
      logger.info(String(message));
    }
  }

  createImapFlow(): ImapFlow {
    const imap = new ImapFlow({
      host: this.imapHost,
      port: this.imapPort || 993,
      secure: this.imapSecure,
      auth: {
        user: this.imapUser,
        pass: this.imapPass,
      },
    });
    return imap;
  }

  async copyToSentFolder(body: Buffer | string): Promise<void> {
    const imap = this.createImapFlow();
    await imap.connect();
    const lock = await imap.getMailboxLock('Sent');
    try {
      await imap.append('Sent', String(body), ['\\Seen']);
    } finally {
      lock.release();
      imap.logout();
    }
  }
}
