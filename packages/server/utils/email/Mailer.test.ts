import { defaultLocale } from '@appsemble/utils';
import { setTestApp } from 'axios-test-instance';
import { type ImapFlow } from 'imapflow';
import { type Transporter } from 'nodemailer';
import { type Mock } from 'vitest';

import { Mailer } from './Mailer.js';
import { App, AppMessages, Organization } from '../../models/index.js';
import { argv, setArgv } from '../argv.js';
import { createServer } from '../createServer.js';
import { useTestDatabase } from '../test/testSchema.js';

let mailer: Mailer;

useTestDatabase(import.meta);

beforeEach(() => {
  setArgv({ host: '', smtpFrom: 'test@example.com', imapCopyToSentFolder: true });
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

describe('sendEmail', () => {
  it('should send emails with a name', async () => {
    mailer.transport = {
      sendMail: vi.fn(() => null),
    } as Partial<Transporter> as Transporter;
    await mailer.sendTemplateEmail({ email: 'test@example.com', name: 'Me' }, 'resend', {
      url: 'https://example.appsemble.app/verify?code=test',
      name: 'Test App',
    });
    expect(mailer.transport.sendMail).toHaveBeenCalledWith({
      to: 'Me <test@example.com>',
      from: 'test@example.com',
      subject: 'Confirm account registration',
      text: expect.any(String),
      html: expect.any(String),
      attachments: [],
    });
  });

  it('should send emails without a name', async () => {
    mailer.transport = {
      sendMail: vi.fn(() => null),
    } as Partial<Transporter> as Transporter;
    await mailer.sendTemplateEmail({ email: 'test@example.com' }, 'resend', {
      url: 'https://example.appsemble.app/verify?code=test',
      name: 'Test App',
    });
    expect(mailer.transport.sendMail).toHaveBeenCalledWith({
      to: 'test@example.com',
      from: 'test@example.com',
      subject: 'Confirm account registration',
      text: expect.any(String),
      html: expect.any(String),
      attachments: [],
    });
  });

  it('should not send emails when smtp is not configured', async () => {
    expect(
      await mailer.sendTemplateEmail({ email: 'test@example.com' }, 'resend', {
        url: 'https://example.appsemble.app/verify?code=test',
        name: 'The Appsemble Team',
      }),
    ).toBeUndefined();
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
<meta name="viewport" content="width=device-width, initial-scale=1">
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
<meta name="viewport" content="width=device-width, initial-scale=1">
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
<meta name="viewport" content="width=device-width, initial-scale=1">
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
<meta name="viewport" content="width=device-width, initial-scale=1">
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
<meta name="viewport" content="width=device-width, initial-scale=1">
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
<meta name="viewport" content="width=device-width, initial-scale=1">
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
          to: { email: 'test@example.com', name: values.name },
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
  beforeAll(() => {
    vi.useFakeTimers({
      shouldAdvanceTime: true,
      now: 0,
    });
  });

  afterAll(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should copy the email to the sent folder', async () => {
    const appendMock = vi.fn<[string, string, string[]], ReturnType<ImapFlow['append']>>(
      () => Promise.resolve() as any,
    );
    mailer.transport = {
      sendMail: vi.fn(() => Promise.resolve() as any),
    } as Partial<Transporter> as Transporter;
    mailer.imap = {
      append: appendMock,
      connect: vi.fn(() => Promise.resolve() as any),
    } as Partial<ImapFlow> as ImapFlow;
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
    expect(mailer.imap.connect).toHaveBeenCalledWith();
    expect(appendMock.mock.calls[0][0]).toBe('Sent');
    const appendCallBody = appendMock.mock.calls[0][1]
      .replace(/^\s*boundary=.*$/gm, '')
      .replace(/^Message-ID: <.*@example\.com>$/gm, '')
      .replace(/^-{4}_NmP-.*-Part_1(?:--)?$/gm, '');
    expect(appendCallBody).toMatchSnapshot();
    expect(appendMock.mock.calls[0][2]).toStrictEqual(['\\Seen']);
  });
});
