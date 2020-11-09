import { Transporter } from 'nodemailer';

import { Mailer } from './Mailer';

let mailer: Mailer;

beforeEach(() => {
  mailer = new Mailer({ host: '' });
});

describe('verify', () => {
  it('should succeed if no transport exists', async () => {
    expect(await mailer.verify()).toBeUndefined();
  });

  it('should succeed if the transport verification succeeds', async () => {
    mailer.transport = ({
      verify: () => Promise.resolve(true as const),
    } as Partial<Transporter>) as Transporter;
    expect(await mailer.verify()).toBeUndefined();
  });

  it('should fail if the transport verification fails', async () => {
    mailer.transport = ({
      verify: () => Promise.reject(new Error('fail')),
    } as Partial<Transporter>) as Transporter;
    await expect(mailer.verify()).rejects.toThrow(new Error('fail'));
  });
});

describe('sendEmail', () => {
  it('should send emails with a name', async () => {
    mailer.transport = ({
      sendMail: jest.fn().mockResolvedValue(null),
    } as Partial<Transporter>) as Transporter;
    await mailer.sendTemplateEmail({ email: 'test@example.com', name: 'Me' }, 'resend', {
      url: 'https://example.appsemble.app/verify?code=test',
    });
    expect(mailer.transport.sendMail).toHaveBeenCalledWith({
      to: 'Me <test@example.com>',
      subject: 'Confirm account registration',
      text: expect.any(String),
      html: expect.any(String),
      attachments: [],
    });
  });

  it('should send emails without a name', async () => {
    mailer.transport = ({
      sendMail: jest.fn().mockResolvedValue(null),
    } as Partial<Transporter>) as Transporter;
    await mailer.sendTemplateEmail({ email: 'test@example.com' }, 'resend', {
      url: 'https://example.appsemble.app/verify?code=test',
    });
    expect(mailer.transport.sendMail).toHaveBeenCalledWith({
      to: 'test@example.com',
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
      }),
    ).toBeUndefined();
  });
});
