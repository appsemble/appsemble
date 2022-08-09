import { setArgv } from './argv.js';
import { getSentryClientSettings } from './sentry.js';

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

  it('should work with multiple allowed domains', () => {
    setArgv({
      sentryAllowedDomains: 'appsemble.app,*.test.appsemble.app',
      sentryDsn: 'https://0123456789abcdef@sentry.io/42',
      sentryEnvironment: 'test',
    });
    const resultA = getSentryClientSettings('appsemble.app');
    const resultB = getSentryClientSettings('testApp.test.appsemble.app');
    const resultC = getSentryClientSettings('example.com');
    const resultD = getSentryClientSettings('testApp.appsemble.appsemble.app');

    expect(resultA).toStrictEqual({
      reportUri: 'https://sentry.io/api/42/security/?sentry_key=0123456789abcdef',
      sentryDsn: 'https://0123456789abcdef@sentry.io/42',
      sentryEnvironment: 'test',
      sentryOrigin: 'https://sentry.io',
    });
    expect(resultB).toStrictEqual({
      reportUri: 'https://sentry.io/api/42/security/?sentry_key=0123456789abcdef',
      sentryDsn: 'https://0123456789abcdef@sentry.io/42',
      sentryEnvironment: 'test',
      sentryOrigin: 'https://sentry.io',
    });
    expect(resultC).toStrictEqual({});
    expect(resultD).toStrictEqual({});
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

  it('should ignore domain checks if a custom sentry DSN is used', () => {
    setArgv({
      sentryAllowedDomains: '*.foo.example',
      sentryDsn: 'https://0123456789abcdef@sentry.io/42',
      sentryEnvironment: 'test',
    });
    const result = getSentryClientSettings(
      'foo.bar.example',
      'https://0123456789abcdef@sentry.io/43',
      'test-2',
    );
    expect(result).toStrictEqual({
      reportUri: 'https://sentry.io/api/43/security/?sentry_key=0123456789abcdef',
      sentryDsn: 'https://0123456789abcdef@sentry.io/43',
      sentryEnvironment: 'test-2',
      sentryOrigin: 'https://sentry.io',
    });
  });

  it('should set the environment to undefined if a custom sentry DSN is used without a custom environment', () => {
    setArgv({
      sentryAllowedDomains: '*.foo.example',
      sentryDsn: 'https://0123456789abcdef@sentry.io/42',
      sentryEnvironment: 'test',
    });
    const result = getSentryClientSettings(
      'foo.bar.example',
      'https://0123456789abcdef@sentry.io/43',
    );
    expect(result).toStrictEqual({
      reportUri: 'https://sentry.io/api/43/security/?sentry_key=0123456789abcdef',
      sentryDsn: 'https://0123456789abcdef@sentry.io/43',
      sentryEnvironment: undefined,
      sentryOrigin: 'https://sentry.io',
    });
  });
});
