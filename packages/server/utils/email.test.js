import {
  processTemplate,
  resendVerificationEmail,
  sendEmail,
  sendOrganizationInviteEmail,
  sendResetPasswordEmail,
  sendWelcomeEmail,
} from './email';

describe('sendMail', () => {
  it('should convert markdown to text and html', async () => {
    const result = await sendEmail(
      { to: 'test@example.com', from: 'test@example.com', subject: 'Test' },
      '**Bold Text** Regular text',
      null,
    );

    const converted = JSON.parse(result.message);

    expect(converted.to).toMatchSnapshot();
    expect(converted.html).toMatchSnapshot();
    expect(converted.markdown).toMatchSnapshot();
  });
});

describe('processTemplate', () => {
  it('should insert template variables', async () => {
    const template = 'Hello **<%= name %>**';
    const { attributes, content } = processTemplate(template, { name: 'John Doe' });

    expect(attributes).toStrictEqual({ name: 'John Doe' });
    expect(content).toBe('Hello **John Doe**');
  });

  it('should extract template variables', async () => {
    const template = '---\nsubject: Test\n---\nTest Message';
    const { attributes, content } = processTemplate(template, {});

    expect(attributes).toStrictEqual({ subject: 'Test' });
    expect(content).toBe('Test Message');
  });
});

describe('sendWelcomeEmail', () => {
  it('should match its snapshot', async () => {
    const result = await sendWelcomeEmail(
      { email: 'test@example.com', name: 'John Doe', url: 'https://example.com/test' },
      null,
    );

    const converted = JSON.parse(result.message);
    converted.messageId = '<TestMessageId>';
    expect(converted).toMatchSnapshot();
  });
});

describe('resendVerificationEmail', () => {
  it('should match its snapshot', async () => {
    const result = await resendVerificationEmail(
      { email: 'test@example.com', name: 'John Doe', url: 'https://example.com/test' },
      null,
    );

    const converted = JSON.parse(result.message);
    converted.messageId = '<TestMessageId>';
    expect(converted).toMatchSnapshot();
  });
});

describe('sendForgetPasswordEmail', () => {
  it('should match its snapshot', async () => {
    const result = await sendResetPasswordEmail(
      { email: 'test@example.com', name: 'John Doe', url: 'https://example.com/test' },
      null,
    );

    const converted = JSON.parse(result.message);
    converted.messageId = '<TestMessageId>';
    expect(converted).toMatchSnapshot();
  });
});

describe('sendOrganizationInviteEmail', () => {
  it('should match its snapshot', async () => {
    const result = await sendOrganizationInviteEmail(
      { email: 'test@example.com', organization: 'Appsemble', url: 'https://example.com/test' },
      null,
    );

    const converted = JSON.parse(result.message);
    converted.messageId = '<TestMessageId>';
    expect(converted).toMatchSnapshot();
  });
});
