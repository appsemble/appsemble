import Mailer from './Mailer';

let mailer;

beforeEach(() => {
  mailer = new Mailer({});
});

describe('verify', () => {
  it('should succeed if no transport exists', async () => {
    expect(await mailer.verify()).toBeUndefined();
  });

  it('should succeed if the transport verification succeeds', async () => {
    mailer.transport = {
      async verify() {
        return true;
      },
    };
    expect(await mailer.verify()).toBeUndefined();
  });

  it('should fail if the transport verification fails', async () => {
    mailer.transport = {
      async verify() {
        throw new Error('fail');
      },
    };
    await expect(mailer.verify()).rejects.toThrow(Error, 'fail');
  });
});

describe('sendEmail', () => {
  it('should send emails with a name', async () => {
    mailer.transport = {
      sendMail: jest.fn().mockResolvedValue(),
    };
    await mailer.sendEmail({ email: 'test@example.com', name: 'Me' }, 'resend', {
      url: 'https://example.appsemble.app/verify?code=test',
    });
    expect(mailer.transport.sendMail).toHaveBeenCalledWith({
      to: 'Me <test@example.com>',
      subject: 'Confirm account registration',
      text: expect.any(String),
      html: expect.any(String),
    });
  });

  it('should send emails without a name', async () => {
    mailer.transport = {
      sendMail: jest.fn().mockResolvedValue(),
    };
    await mailer.sendEmail({ email: 'test@example.com' }, 'resend', {
      url: 'https://example.appsemble.app/verify?code=test',
    });
    expect(mailer.transport.sendMail).toHaveBeenCalledWith({
      to: 'test@example.com',
      subject: 'Confirm account registration',
      text: expect.any(String),
      html: expect.any(String),
    });
  });

  it('should not send emails when smtp is not configured', async () => {
    expect(
      await mailer.sendEmail({ email: 'test@example.com' }, 'resend', {
        url: 'https://example.appsemble.app/verify?code=test',
      }),
    ).toBeUndefined();
  });
});
