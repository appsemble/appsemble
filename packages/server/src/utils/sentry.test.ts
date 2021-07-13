import { setArgv } from './argv';
import { getSentryClientSettings } from './sentry';

describe('getSentryClientSettings', () => {
  it('should be able to convert hosted sentry DSNs', () => {
    setArgv({
      sentryAllowedDomains: '*',
      sentryDsn: 'https://0123456789abcdef@sentry.io/42',
    });
    const result = getSentryClientSettings('example.com');
    expect(result).toStrictEqual({
      reportUri: 'https://sentry.io/api/42/security/?sentry_key=0123456789abcdef',
      sentryDsn: 'https://0123456789abcdef@sentry.io/42',
      sentryEnvironment: undefined,
      sentryOrigin: 'https://sentry.io',
    });
  });

  it('should be able to convert custom sentry DSNs', () => {
    setArgv({
      sentryAllowedDomains: '*',
      sentryDsn: 'http://fedcba9876543210@example.com/123',
    });
    const result = getSentryClientSettings('example.com');
    expect(result).toStrictEqual({
      reportUri: 'http://example.com/api/123/security/?sentry_key=fedcba9876543210',
      sentryDsn: 'http://fedcba9876543210@example.com/123',
      sentryEnvironment: undefined,
      sentryOrigin: 'http://example.com',
    });
  });

  it('should return the sentry environment', () => {
    setArgv({
      sentryAllowedDomains: '*',
      sentryDsn: 'https://0123456789abcdef@sentry.io/42',
      sentryEnvironment: 'test',
    });
    const result = getSentryClientSettings('example.com');
    expect(result).toStrictEqual({
      reportUri: 'https://sentry.io/api/42/security/?sentry_key=0123456789abcdef',
      sentryDsn: 'https://0123456789abcdef@sentry.io/42',
      sentryEnvironment: 'test',
      sentryOrigin: 'https://sentry.io',
    });
  });

  it('should return an empty object if the domain isn’t allowed', () => {
    setArgv({
      sentryAllowedDomains: '*.foo.example',
      sentryDsn: 'https://0123456789abcdef@sentry.io/42',
      sentryEnvironment: 'test',
    });
    const result = getSentryClientSettings('foo.bar.example');
    expect(result).toStrictEqual({});
  });
});
