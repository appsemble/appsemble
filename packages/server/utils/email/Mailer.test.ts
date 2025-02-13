import { PredefinedOrganizationRole } from '@appsemble/types';
import { defaultLocale } from '@appsemble/utils';
import { setTestApp } from 'axios-test-instance';
import { type ImapFlow, type MailboxLockObject } from 'imapflow';
import { type Transporter } from 'nodemailer';
import { afterAll, afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { Mailer } from './Mailer.js';
import { App, AppMessages, Organization, OrganizationMember, User } from '../../models/index.js';
import { type Argv, argv, setArgv } from '../argv.js';
import { createServer } from '../createServer.js';
import { createTestUser } from '../test/authorization.js';

let mailer: Mailer;

const baseArgv: Partial<Argv> = {
  host: '',
  smtpFrom: 'test@example.com',
};

describe('Mailer', () => {
  beforeEach(() => {
    setArgv(baseArgv);
    mailer = new Mailer(argv);
  });

  describe('verify', () => {
    it('should succeed if no transport exists', async () => {
      expect(await mailer.verify()).toBeUndefined();
    });

    it('should succeed if the transport verification succeeds', async () => {
      mailer.transport = {
        verify: () => Promise.resolve(true as const),
      } as Partial<Transporter> as Transporter;
      expect(await mailer.verify()).toBeUndefined();
    });

    it('should fail if the transport verification fails', async () => {
      mailer.transport = {
        verify: () => Promise.reject(new Error('fail')),
      } as Partial<Transporter> as Transporter;
      await expect(mailer.verify()).rejects.toThrow(new Error('fail'));
    });
  });

  describe('sendTranslatedEmail', () => {
    let app: App;
    const supportedLocales = [defaultLocale, 'nl'];

    const tests = {
      resend: [
        {
          name: 'null',
          link: (text: string) => `[${text}](https://example.com)`,
          appName: 'Test App',
        },
        {
          name: 'John Doe',
          link: (text: string) => `[${text}](https://example.com)`,
          appName: 'Test App',
        },
      ],
      reset: [
        {
          name: 'null',
          link: (text: string) => `[${text}](https://example.com)`,
          appName: 'Test App',
        },
        {
          name: 'John Doe',
          link: (text: string) => `[${text}](https://example.com)`,
          appName: 'Test App',
        },
      ],
      welcome: [
        {
          name: 'null',
          link: (text: string) => `[${text}](https://example.com)`,
          appName: 'Test App',
        },
        {
          name: 'John Doe',
          link: (text: string) => `[${text}](https://example.com)`,
          appName: 'Test App',
        },
      ],
      appMemberEmailChange: [
        {
          name: 'null',
          link: (text: string) => `[${text}](https://example.com)`,
          appName: 'Test App',
        },
        {
          name: 'John Doe',
          link: (text: string) => `[${text}](https://example.com)`,
          appName: 'Test App',
        },
      ],
      organizationInvite: [
        {
          name: 'null',
          link: (text: string) => `[${text}](https://example.com)`,
          appName: 'null',
          organization: 'Test Organization',
        },
        {
          name: 'John Doe',
          link: (text: string) => `[${text}](https://example.com)`,
          appName: 'null',
          organization: 'Test Organization',
        },
      ],
      groupInvite: [
        {
          name: 'null',
          link: (text: string) => `[${text}](https://example.com)`,
          groupName: 'Test Group',
          appName: 'Test App',
        },
        {
          name: 'John Doe',
          link: (text: string) => `[${text}](https://example.com)`,
          groupName: 'Test Group',
          appName: 'Test App',
        },
      ],
      emailAdded: [
        {
          name: 'null',
          link: (text: string) => `[${text}](https://example.com)`,
          appName: 'Test App',
        },
        {
          name: 'John Doe',
          link: (text: string) => `[${text}](https://example.com)`,
          appName: 'Test App',
        },
        {
          name: 'null',
          link: (text: string) => `[${text}](https://example.com)`,
          appName: 'null',
        },
        {
          name: 'John Doe',
          link: (text: string) => `[${text}](https://example.com)`,
          appName: 'null',
        },
      ],
      appEmailQuotaLimitHit: [
        {
          name: 'null',
          link: (text: string) => `[${text}](https://example.com)`,
          appName: 'Test App',
        },
        {
          name: 'John Doe',
          link: (text: string) => `[${text}](https://example.com)`,
          appName: 'Test App',
        },
      ],
    };

    beforeEach(() => {
      mailer.transport = {
        sendMail: vi.fn(),
      } as Partial<Transporter> as Transporter;
    });

    beforeEach(async () => {
      const server = await createServer();
      await setTestApp(server);
      const organization = await Organization.create({
        id: 'testorganization',
        name: 'Test Organization',
      });
      const user = await User.create({
        name: 'John Doe',
        locale: 'nl',
        email: 'test@example.com',
        timezone: 'Europe/Amsterdam',
      });
      await OrganizationMember.create({
        UserId: user.id,
        OrganizationId: organization.id,
      });
      app = await App.create({
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          security: {
            default: {
              role: 'Reader',
              policy: 'everyone',
            },
            roles: {
              Reader: {},
              Admin: {},
            },
          },
        },
        path: 'test-app',
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      });
    });

    it('should send emails in the default language', async () => {
      await mailer.sendTranslatedEmail({
        appId: app.id,
        emailName: 'welcome',
        to: { email: 'test@example.com', name: 'John Doe' },
        locale: 'en',
        values: {
          name: 'John Doe',
          appName: 'Test App',
          link: (text) => `[${text}](http://example.com/token=abcdefg)`,
        },
      });

      expect(mailer.transport.sendMail).toHaveBeenCalledWith({
        attachments: [],
        from: 'Appsemble <test@example.com>',
        html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1" name="viewport">
</head>
<body>
<p>Hello John Doe,</p>
<p>Thank you for registering your account. Before you can use your account, we need to verify your email address.</p>
<p>Please click <a href="http://example.com/token=abcdefg">here</a> to verify your email address.</p>
<p>Kind regards,</p>
<p><em>Test App</em></p>
</body>
</html>
`,
        subject: 'Welcome to Test App',
        text: `Hello John Doe,

Thank you for registering your account. Before you can use your account, we need to verify your email address.

Please click [here](http://example.com/token=abcdefg) to verify your email address.

Kind regards,

_Test App_
`,
        to: 'John Doe <test@example.com>',
      });
    });

    it('should send emails in another default supported language', async () => {
      await mailer.sendTranslatedEmail({
        appId: app.id,
        emailName: 'welcome',
        to: { email: 'test@example.com', name: 'John Doe' },
        locale: 'nl',
        values: {
          name: 'John Doe',
          appName: 'Test App',
          link: (text) => `[${text}](http://example.com/token=abcdefg)`,
        },
      });

      expect(mailer.transport.sendMail).toHaveBeenCalledWith({
        attachments: [],
        from: 'Appsemble <test@example.com>',
        html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1" name="viewport">
</head>
<body>
<p>Beste John Doe,</p>
<p>Bedankt voor het registeren van jouw account. Voordat je jouw account kan gebruiken, moeten we jouw e-mailadres verifiëren.</p>
<p>Klik <a href="http://example.com/token=abcdefg">hier</a> om jouw e-mailadres te verifiëren.</p>
<p>Met vriendelijke groet,</p>
<p><em>Test App</em></p>
</body>
</html>
`,
        subject: 'Welkom bij Test App',
        text: `Beste John Doe,

Bedankt voor het registeren van jouw account. Voordat je jouw account kan gebruiken, moeten we jouw e-mailadres verifiëren.

Klik [hier](http://example.com/token=abcdefg) om jouw e-mailadres te verifiëren.

Met vriendelijke groet,

_Test App_
`,
        to: 'John Doe <test@example.com>',
      });
    });

    it('should use fall back to the english translations if an app’s email translations don’t exist', async () => {
      await mailer.sendTranslatedEmail({
        appId: app.id,
        emailName: 'welcome',
        to: { email: 'test@example.com', name: 'John Doe' },
        locale: 'jp',
        values: {
          name: 'John Doe',
          appName: 'Test App',
          link: (text) => `[${text}](http://example.com/token=abcdefg)`,
        },
      });

      expect(mailer.transport.sendMail).toHaveBeenCalledWith({
        attachments: [],
        from: 'Appsemble <test@example.com>',
        html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1" name="viewport">
</head>
<body>
<p>Hello John Doe,</p>
<p>Thank you for registering your account. Before you can use your account, we need to verify your email address.</p>
<p>Please click <a href="http://example.com/token=abcdefg">here</a> to verify your email address.</p>
<p>Kind regards,</p>
<p><em>Test App</em></p>
</body>
</html>
`,
        subject: 'Welcome to Test App',
        text: `Hello John Doe,

Thank you for registering your account. Before you can use your account, we need to verify your email address.

Please click [here](http://example.com/token=abcdefg) to verify your email address.

Kind regards,

_Test App_
`,
        to: 'John Doe <test@example.com>',
      });
    });

    it('should use an app’s email translations', async () => {
      await AppMessages.create({
        AppId: app.id,
        language: 'nl-nl',
        messages: {
          core: {
            'server.emails.welcome.subject': 'Aangenaam!',
            'server.emails.welcome.body': 'Hoi {name}!',
          },
        },
      });
      await mailer.sendTranslatedEmail({
        appId: app.id,
        emailName: 'welcome',
        to: { email: 'test@example.com', name: 'John Doe' },
        locale: 'nl-nl',
        values: {
          name: 'John Doe',
          appName: 'Test App',
          link: (text) => `[${text}](http://example.com/token=abcdefg)`,
        },
      });

      expect(mailer.transport.sendMail).toHaveBeenCalledWith({
        attachments: [],
        from: 'Appsemble <test@example.com>',
        html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1" name="viewport">
</head>
<body>
<p>Hoi John Doe!</p>
</body>
</html>
`,
        subject: 'Aangenaam!',
        text: 'Hoi John Doe!\n',
        to: 'John Doe <test@example.com>',
      });
    });

    it('should use an app’s email translations for the base language if the selected locale isn’t directly translated', async () => {
      await AppMessages.create({
        AppId: app.id,
        language: 'nl',
        messages: {
          core: {
            'server.emails.welcome.subject': 'Aangenaam!',
            'server.emails.welcome.body': 'Hoi {name}!',
          },
        },
      });
      await mailer.sendTranslatedEmail({
        appId: app.id,
        emailName: 'welcome',
        to: { email: 'test@example.com', name: 'John Doe' },
        locale: 'nl-nl',
        values: {
          name: 'John Doe',
          appName: 'Test App',
          link: (text) => `[${text}](http://example.com/token=abcdefg)`,
        },
      });

      expect(mailer.transport.sendMail).toHaveBeenCalledWith({
        attachments: [],
        from: 'Appsemble <test@example.com>',
        html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1" name="viewport">
</head>
<body>
<p>Hoi John Doe!</p>
</body>
</html>
`,
        subject: 'Aangenaam!',
        text: 'Hoi John Doe!\n',
        to: 'John Doe <test@example.com>',
      });
    });

    it('should use an app’s english email translation overrides if the base language if the selected locale isn’t translated', async () => {
      await AppMessages.create({
        AppId: app.id,
        language: 'en',
        messages: {
          core: {
            'server.emails.welcome.subject': 'Hello!',
            'server.emails.welcome.body': 'How do you do, {name}?',
          },
        },
      });
      await mailer.sendTranslatedEmail({
        appId: app.id,
        emailName: 'welcome',
        to: { email: 'test@example.com', name: 'John Doe' },
        locale: 'jp',
        values: {
          name: 'John Doe',
          appName: 'Test App',
          link: (text) => `[${text}](http://example.com/token=abcdefg)`,
        },
      });

      expect(mailer.transport.sendMail).toHaveBeenCalledWith({
        attachments: [],
        from: 'Appsemble <test@example.com>',
        html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1" name="viewport">
</head>
<body>
<p>How do you do, John Doe?</p>
</body>
</html>
`,
        subject: 'Hello!',
        text: 'How do you do, John Doe?\n',
        to: 'John Doe <test@example.com>',
      });
    });

    describe.each(supportedLocales)('%s', (locale) => {
      it('should support %s', () => {
        expect(supportedLocales.includes(locale)).toBeTruthy();
      });
    });

    describe.each(Object.entries(tests))('%s', (name, testValues) => {
      describe.each(supportedLocales)('%s', (locale) => {
        it.each(testValues)(`should render ${name} %# for locale ${locale}`, async (values) => {
          await mailer.sendTranslatedEmail({
            appId: app.id,
            emailName: name,
            to: {
              email: 'test@example.com',
              ...(values.name === 'null' ? {} : { name: values.name }),
            },
            values: values as any,
            locale,
          });

          expect(mailer.transport.sendMail).toHaveBeenCalledTimes(1);
          // The subject
          expect((mailer.transport.sendMail as Mock).mock.calls[0][2]).toMatchSnapshot();
          // The body
          expect((mailer.transport.sendMail as Mock).mock.calls[0][0]).toMatchSnapshot();
        });
      });
    });
  });

  describe('copyToSentFolder', () => {
    beforeEach(() => {
      setArgv({ ...baseArgv, imapCopyToSentFolder: true, imapHost: 'test' });
      vi.useFakeTimers({
        shouldAdvanceTime: true,
      });
      // https://github.com/vitest-dev/vitest/issues/1154#issuecomment-1138717832
      vi.clearAllTimers();
      vi.setSystemTime(0);
    });

    afterAll(() => {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    });

    it('should copy the email to the sent folder', async () => {
      mailer.transport = {
        sendMail: vi.fn(),
      } as Partial<Transporter> as Transporter;
      const mockedLock: Partial<MailboxLockObject> = {
        release: vi.fn(),
      };
      const mockedFlow: Partial<ImapFlow> = {
        connect: vi.fn(),
        getMailboxLock: vi.fn().mockResolvedValue(mockedLock),
        append:
          vi.fn<
            (path: string, content: string, flags: string[]) => ReturnType<ImapFlow['append']>
          >(),
        logout: vi.fn(),
      };
      const appendMock = mockedFlow.append as ReturnType<typeof vi.fn>;
      vi.spyOn(mailer, 'createImapFlow').mockReturnValue(mockedFlow as ImapFlow);
      vi.spyOn(mailer, 'copyToSentFolder');
      vi.setSystemTime(0);
      await mailer.sendEmail({
        to: 'Me <test@example.com>',
        from: 'test@example.com',
        subject: 'Test',
        text: 'Test',
        html: '<p>Test</p>',
        attachments: [],
      });
      expect(mailer.transport.sendMail).toHaveBeenCalledWith({
        to: 'Me <test@example.com>',
        from: 'test@example.com <test@example.com>',
        subject: 'Test',
        text: 'Test',
        html: '<p>Test</p>',
        attachments: [],
      });
      expect(mailer.copyToSentFolder).toHaveBeenCalledOnce();
      expect(mockedFlow.append).toHaveBeenCalledOnce();
      expect(appendMock.mock.calls[0][0]).toBe('Sent');
      const appendCallBody = appendMock.mock.calls[0][1]
        .replaceAll(/^\s*boundary=.*$/gm, '')
        .replaceAll(/^Message-ID: <.*@example\.com>$/gm, '')
        .replaceAll(/^Date: .+$/gm, '')
        .replaceAll(/^-{4}_NmP-.*-Part_1(?:--)?$/gm, '');
      expect(appendCallBody).toMatchSnapshot();
      expect(appendMock.mock.calls[0][2]).toStrictEqual(['\\Seen']);
    });
  });

  describe('emailQuota', () => {
    let app: App;
    let user: User;

    beforeEach(() => {
      vi.useFakeTimers();
      // https://github.com/vitest-dev/vitest/issues/1154#issuecomment-1138717832
      vi.clearAllTimers();
      vi.setSystemTime(0);
      setArgv({ ...baseArgv, enableAppEmailQuota: true, dailyAppEmailQuota: 3 });
    });

    beforeEach(async () => {
      const server = await createServer();
      await setTestApp(server);
      user = await createTestUser();
      const organization = await Organization.create({
        id: 'testorganization',
        name: 'Test Organization',
      });
      await OrganizationMember.create({
        OrganizationId: organization.id,
        UserId: user.id,
        role: PredefinedOrganizationRole.Owner,
      });
      app = await App.create({
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          security: {
            default: {
              role: 'Reader',
              policy: 'everyone',
            },
            roles: {
              Reader: {},
              Admin: {},
            },
          },
        },
        path: 'test-app',
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should rate limit emails based on quota (sendTranslatedEmail)', async () => {
      mailer.transport = {
        sendMail: vi.fn(),
      } as Partial<Transporter> as Transporter;

      const email: Parameters<Mailer['sendTranslatedEmail']>[0] = {
        appId: app.id,
        app,
        emailName: 'welcome',
        to: { email: 'test@example.com', name: 'John Doe' },
        locale: 'en',
        values: {
          name: 'John Doe',
          appName: 'Test App',
          link: (text) => `[${text}](https://example.com/token=abcdefg)`,
        },
      };

      await mailer.sendTranslatedEmail(email);
      vi.advanceTimersByTime(60 * 1000);
      await mailer.sendTranslatedEmail(email);
      vi.advanceTimersByTime(60 * 1000);
      await mailer.sendTranslatedEmail(email);
      vi.advanceTimersByTime(60 * 1000);
      expect(mailer.transport.sendMail).toHaveBeenCalledTimes(3);

      await expect(mailer.sendTranslatedEmail(email)).rejects.toThrow('Too many emails sent today');
      expect(mailer.transport.sendMail).toHaveBeenCalledTimes(3);
    });

    it('should rate limit emails based on quota (sendEmail)', async () => {
      mailer.transport = {
        sendMail: vi.fn(),
      } as Partial<Transporter> as Transporter;

      const email: Parameters<Mailer['sendEmail']>[0] = {
        to: 'test@example.com',
        from: 'test@example.com',
        subject: 'Test',
        text: 'Test',
        html: '<p>Test</p>',
        attachments: [],
        app,
      };

      await mailer.sendEmail(email);
      vi.advanceTimersByTime(60 * 1000);
      await mailer.sendEmail(email);
      vi.advanceTimersByTime(60 * 1000);
      await mailer.sendEmail(email);
      vi.advanceTimersByTime(60 * 1000);
      expect(mailer.transport.sendMail).toHaveBeenCalledTimes(3);

      await expect(mailer.sendEmail(email)).rejects.toThrow('Too many emails sent today');
      expect(mailer.transport.sendMail).toHaveBeenCalledTimes(3);
    });

    it('should reset app email quota after midnight UTC', async () => {
      mailer.transport = {
        sendMail: vi.fn(),
      } as Partial<Transporter> as Transporter;

      const email: Parameters<Mailer['sendTranslatedEmail']>[0] = {
        appId: app.id,
        app,
        emailName: 'welcome',
        to: { email: 'test@example.com', name: 'John Doe' },
        locale: 'en',
        values: {
          name: 'John Doe',
          appName: 'Test App',
          link: (text) => `[${text}](https://example.com/token=abcdefg)`,
        },
      };

      await mailer.sendTranslatedEmail(email);
      vi.advanceTimersByTime(60 * 1000);
      await mailer.sendTranslatedEmail(email);
      vi.advanceTimersByTime(60 * 1000);
      await mailer.sendTranslatedEmail(email);
      vi.advanceTimersByTime(60 * 1000);

      expect(mailer.transport.sendMail).toHaveBeenCalledTimes(3);

      await expect(mailer.sendTranslatedEmail(email)).rejects.toThrow('Too many emails sent today');
      expect(mailer.transport.sendMail).toHaveBeenCalledTimes(3);

      // After this, the time should be 1970-01-02T00:00:03.000Z
      vi.advanceTimersByTime(24 * 60 * 60 * 1000);

      await mailer.sendTranslatedEmail(email);
      expect(mailer.transport.sendMail).toHaveBeenCalledTimes(4);
    });

    it('should not rate limit emails sent without an app ID', async () => {
      mailer.transport = {
        sendMail: vi.fn(),
      } as Partial<Transporter> as Transporter;

      const email: Parameters<Mailer['sendEmail']>[0] = {
        to: 'Me <test@example.com>',
        from: 'test@example.com',
        subject: 'Test',
        text: 'Test',
        html: '<p>Test</p>',
        attachments: [],
      };

      await mailer.sendEmail(email);
      vi.advanceTimersByTime(60 * 1000);
      await mailer.sendEmail(email);
      vi.advanceTimersByTime(60 * 1000);
      await mailer.sendEmail(email);
      vi.advanceTimersByTime(60 * 1000);
      await mailer.sendEmail(email);
      vi.advanceTimersByTime(60 * 1000);
      expect(mailer.transport.sendMail).toHaveBeenCalledTimes(4);
    });

    it('should not rate limit emails if the enableAppEmailQuota flag is not set', async () => {
      setArgv({ ...baseArgv, enableAppEmailQuota: false, dailyAppEmailQuota: 3 });
      mailer.transport = {
        sendMail: vi.fn(),
      } as Partial<Transporter> as Transporter;

      const email: Parameters<Mailer['sendEmail']>[0] = {
        to: 'Me <test@example.com>',
        from: 'test@example.com',
        subject: 'Test',
        text: 'Test',
        html: '<p>Test</p>',
        attachments: [],
        app,
      };
      const translatedEmail: Parameters<Mailer['sendTranslatedEmail']>[0] = {
        appId: app.id,
        app,
        emailName: 'welcome',
        to: { email: 'test@example.com', name: 'John Doe' },
        locale: 'en',
        values: {
          name: 'John Doe',
          appName: 'Test App',
          link: (text) => `[${text}](https://example.com/token=abcdefg)`,
        },
      };

      await mailer.sendTranslatedEmail(translatedEmail);
      vi.advanceTimersByTime(60 * 1000);
      await mailer.sendTranslatedEmail(translatedEmail);
      vi.advanceTimersByTime(60 * 1000);
      await mailer.sendTranslatedEmail(translatedEmail);
      vi.advanceTimersByTime(60 * 1000);
      await mailer.sendTranslatedEmail(translatedEmail);
      expect(mailer.transport.sendMail).toHaveBeenCalledTimes(4);

      vi.advanceTimersByTime(60 * 1000);
      await mailer.sendEmail(email);
      vi.advanceTimersByTime(60 * 1000);
      await mailer.sendEmail(email);
      vi.advanceTimersByTime(60 * 1000);
      await mailer.sendEmail(email);
      vi.advanceTimersByTime(60 * 1000);
      await mailer.sendEmail(email);
      expect(mailer.transport.sendMail).toHaveBeenCalledTimes(8);
    });

    it('should alert organization owners when the app email quota is exceeded', async () => {
      setArgv({
        ...baseArgv,
        enableAppEmailQuota: true,
        dailyAppEmailQuota: 3,
        enableAppEmailQuotaAlerts: true,
      });
      mailer.transport = {
        sendMail: vi.fn(),
      } as Partial<Transporter> as Transporter;

      const email: Parameters<Mailer['sendTranslatedEmail']>[0] = {
        appId: app.id,
        app,
        emailName: 'welcome',
        to: { email: 'test@example.com', name: 'John Doe' },
        locale: 'en',
        values: {
          name: 'John Doe',
          appName: 'Test App',
          link: (text) => `[${text}](https://example.com/token=abcdefg)`,
        },
      };

      await mailer.sendTranslatedEmail(email);
      vi.advanceTimersByTime(60 * 1000);
      await mailer.sendTranslatedEmail(email);
      vi.advanceTimersByTime(60 * 1000);
      await mailer.sendTranslatedEmail(email);
      vi.advanceTimersByTime(60 * 1000);

      expect(mailer.transport.sendMail).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({
          subject: 'Email quota hit',
        }),
      );

      expect(mailer.transport.sendMail).toHaveBeenNthCalledWith(
        4,
        expect.objectContaining({
          subject: 'Welcome to Test App',
        }),
      );
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      const server = await createServer();
      await setTestApp(server);
    });

    const email: Parameters<Mailer['sendEmail']>[0] = {
      to: 'test@example.com',
      from: 'test@example.com',
      subject: 'Test',
      text: 'Test',
      html: '<p>Test</p>',
      attachments: [],
    };

    it('should raise a generic error', async () => {
      mailer.transport = {
        sendMail: vi.fn().mockRejectedValue({}),
      } as Partial<Transporter> as Transporter;

      await expect(() => mailer.sendEmail(email)).rejects.toThrow(
        'Something went wrong when sending the email.',
      );
    });

    it('should raise a eenvelope error', async () => {
      mailer.transport = {
        sendMail: vi.fn().mockRejectedValue({
          code: 'EENVELOPE',
        }),
      } as Partial<Transporter> as Transporter;

      await expect(() => mailer.sendEmail(email)).rejects.toThrow(
        'Unable to determine the sender or recipient of the message.',
      );
    });
  });
});
