import { sentryDsnToReportUri } from './sentry';

describe('sentryDsnToReportUri', () => {
  it('should be able to convert hosted sentry DSNs', () => {
    const { origin, reportUri } = sentryDsnToReportUri('https://0123456789abcdef@sentry.io/42');
    expect(reportUri).toBe('https://sentry.io/api/42/security/?sentry_key=0123456789abcdef');
    expect(origin).toBe('https://sentry.io');
  });

  it('should be able to convert custom sentry DSNs', () => {
    const { origin, reportUri } = sentryDsnToReportUri('http://fedcba9876543210@example.com/123');
    expect(reportUri).toBe('http://example.com/api/123/security/?sentry_key=fedcba9876543210');
    expect(origin).toBe('http://example.com');
  });
});