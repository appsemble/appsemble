import { version } from '@appsemble/node-utils';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { matcher } from 'matcher';

import { argv } from './argv.js';

interface SentrySettings {
  /**
   * The CORS `report-uri` to use for CSP violation reports.
   */
  reportUri?: string;

  /**
   * The Sentry origin that must be allowed in CSP directives.
   */
  sentryOrigin?: string;

  /**
   * The configured Sentry DSN that should be exposed to the client.
   */
  sentryDsn?: string;

  /**
   * The Sentry environment name to attach to events.
   */
  sentryEnvironment?: string;
}

/**
 * Parse a sample rate and fall back to a safe default when invalid.
 *
 * @param input The configured sample rate.
 * @param fallback The default sample rate used on invalid input.
 * @returns A number between 0 and 1.
 */
function parseSampleRate(input: string | number | undefined, fallback: number): number {
  const parsed = typeof input === 'number' ? input : Number.parseFloat(input ?? '');

  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    return fallback;
  }

  return parsed;
}

/**
 * Verify whether a Sentry DSN is a valid URL.
 *
 * @param dsn The Sentry DSN to verify.
 * @returns Whether the DSN can be parsed and contains a valid project identifier.
 */
export function isValidSentryDsn(dsn: string): boolean {
  try {
    const { pathname, protocol, username } = new URL(dsn);

    if (!username || (protocol !== 'http:' && protocol !== 'https:')) {
      return false;
    }

    const pathSegments = pathname.split('/').filter(Boolean);
    const projectId = pathSegments.at(-1);

    return Boolean(projectId && /^\d+$/.test(projectId));
  } catch {
    return false;
  }
}

/**
 * Get client-side Sentry settings for the given domain.
 *
 * @param domain The domain name to check.
 * @param sentryDsn An optional app-specific Sentry DSN override.
 * @param sentryEnvironment An optional app-specific Sentry environment override.
 * @returns Sentry DSN/origin/report URI when Sentry should be enabled for this domain.
 */
export function getSentryClientSettings(
  domain: string,
  sentryDsn?: string,
  sentryEnvironment?: string,
): SentrySettings {
  if (
    !sentryDsn &&
    (!argv.sentryDsn ||
      !argv.sentryAllowedDomains ||
      !matcher(domain, argv.sentryAllowedDomains.split(',')).length)
  ) {
    return {};
  }

  const dsn = sentryDsn || argv.sentryDsn;
  if (!isValidSentryDsn(dsn)) {
    if (sentryDsn) {
      return {};
    }

    throw new Error('Invalid Sentry DSN');
  }

  const { origin, pathname, username } = new URL(dsn);

  return {
    sentryDsn: dsn,
    sentryEnvironment: sentryDsn
      ? sentryEnvironment || undefined
      : argv.sentryEnvironment || undefined,
    sentryOrigin: origin,
    reportUri: `${origin}/api${pathname}/security/?sentry_key=${username}`,
  };
}

/**
 * Configure server-side Sentry instrumentation.
 *
 * @param settings Server-side Sentry settings including `sentryDsn`, `sentryEnvironment`, `tracesSampleRate`, and `profileSampleRate`.
 */
export function configureSentry(settings: {
  sentryDsn: string;
  sentryEnvironment?: string;
  tracesSampleRate?: string | number;
  profileSampleRate?: string | number;
}): void {
  const { sentryDsn, sentryEnvironment, tracesSampleRate, profileSampleRate } = settings;

  if (sentryDsn) {
    const effectiveTracesSampleRate = parseSampleRate(tracesSampleRate, 0.2);
    const effectiveProfileSampleRate = parseSampleRate(profileSampleRate, 0.25);

    Sentry.init({
      dsn: sentryDsn,
      environment: sentryEnvironment,
      release: version,
      integrations: [nodeProfilingIntegration(), Sentry.postgresIntegration()],
      tracesSampleRate: effectiveTracesSampleRate,
      profilesSampleRate: effectiveProfileSampleRate,
      profileSessionSampleRate: effectiveProfileSampleRate,
      profileLifecycle: 'trace',
    });
  }
}
