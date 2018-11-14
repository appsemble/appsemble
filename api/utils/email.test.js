import { processTemplate, sendEmail, sendWelcomeEmail, resendVerificationEmail } from './email';

describe('sendMail', () => {
  it('should convert markdown to text and html', async () => {
    const result = await sendEmail(
      { to: 'test@example.com', from: 'test@example.com', subject: 'Test' },
      '**Bold Text** Regular text',
      null,
    );

    const {
      envelope: { to },
    } = result;
    const converted = result.response.toString();

    expect(to).toStrictEqual(['test@example.com']);
    expect(converted).toMatch('Content-Type: multipart/alternative;');
    expect(converted).toMatch('Content-Type: text/plain');
    expect(converted).toMatch('Content-Type: text/html');
    expect(converted).toMatch('**Bold Text** Regular text');
    expect(converted).toMatch('<p><strong>Bold Text</strong> Regular text</p>');
    expect(converted).toMatchSnapshot();
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
    const template = `---\nsubject: Test\n---\nTest Message`;
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

    const converted = result.response.toString();
    expect(converted).toMatchSnapshot();
  });

  it('should combine name and email', async () => {
    const result = await sendWelcomeEmail(
      { email: 'test@example.com', name: 'John Doe', url: 'https://example.com/test' },
      null,
    );

    const converted = result.response.toString();
    expect(converted).toMatch('John Doe <test@example.com>');
  });
});

describe('resendVerificationEmail', () => {
  it('should match its snapshot', async () => {
    const result = await resendVerificationEmail(
      { email: 'test@example.com', name: 'John Doe', url: 'https://example.com/test' },
      null,
    );

    const converted = result.response.toString();
    expect(converted).toMatchSnapshot();
  });

  it('should combine name and email', async () => {
    const result = await resendVerificationEmail(
      { email: 'test@example.com', name: 'John Doe', url: 'https://example.com/test' },
      null,
    );

    const converted = result.response.toString();
    expect(converted).toMatch('John Doe <test@example.com>');
  });
});
