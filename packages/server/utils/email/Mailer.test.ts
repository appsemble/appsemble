import { defaultLocale } from '@appsemble/utils';
import { setTestApp } from 'axios-test-instance';
import { Transporter } from 'nodemailer';

import { App, AppMessages, Organization } from '../../models/index.js';
import { argv, setArgv } from '../argv.js';
import { createServer } from '../createServer.js';
import { useTestDatabase } from '../test/testSchema.js';
import { Mailer } from './Mailer.js';
import * as RenderEmail from './renderEmail.js';

let mailer: Mailer;

useTestDatabase('mailer');

beforeEach(() => {
  setArgv({ host: '', smtpFrom: 'test@example.com' });
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
      sendMail: jest.fn().mockResolvedValue(null),
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
      sendMail: jest.fn().mockResolvedValue(null),
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
  let spy: jest.SpyInstance<
    Promise<{
      html: string;
      subject: string;
      text: string;
    }>,
    [template: string, values: Record<string, string>, sub?: string]
  >;

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

  beforeEach(async () => {
    const server = await createServer();
    await setTestApp(server);
    spy = jest.spyOn(RenderEmail, 'renderEmail');
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

    expect(spy).toHaveBeenCalledWith(
      `Hello John Doe,

Thank you for registering your account. Before you can use your account, we need to verify your email address.

Please click [here](http://example.com/token=abcdefg) to verify your email address.

Kind regards,

_Test App_`,
      {},
      'Welcome to Test App',
    );
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

    expect(spy).toHaveBeenCalledWith(
      `Beste John Doe,

Bedankt voor het registeren van jouw account. Voordat je jouw account kan gebruiken, moeten we jouw e-mailadres verifiëren.

Klik [hier](http://example.com/token=abcdefg) om jouw e-mailadres te verifiëren.

Met vriendelijke groet,

_Test App_`,
      {},
      'Welkom bij Test App',
    );
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

    expect(spy).toHaveBeenCalledWith(expect.any(String), {}, 'Welcome to Test App');
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

    expect(spy).toHaveBeenCalledWith('Hoi John Doe!', {}, 'Aangenaam!');
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

    expect(spy).toHaveBeenCalledWith('Hoi John Doe!', {}, 'Aangenaam!');
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

    expect(spy).toHaveBeenCalledWith('How do you do, John Doe?', {}, 'Hello!');
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

        expect(spy).toHaveBeenCalledTimes(1);
        // The subject
        expect(spy.mock.calls[0][2]).toMatchSnapshot();
        // The body
        expect(spy.mock.calls[0][0]).toMatchSnapshot();
      });
    });
  });
});
