import { version } from '@appsemble/node-utils';
import { makeDsn } from '@sentry/core';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { matcher } from 'matcher';

import { argv } from './argv.js';

interface SentrySettings {
  /**
   * The CORS `report-uri` to use.
   */
  reportUri?: string;

  /**
   * The Sentry origin to allow making requests to.
   */
  sentryOrigin?: string;

  /**
   * The configured Sentry DSN.
   */
  sentryDsn?: string;

  /**
   * The Sentry environment to use.
   */
  sentryEnvironment?: string;
}

/**
 * Verify whether a Sentry DSN is a valid URL.
 *
 * @param dsn The Sentry DSN to verify.
 * @returns Whether the DSN can be parsed as an HTTP(S) URL.
 */
export function isValidSentryDsn(dsn: string): boolean {
  return Boolean(makeDsn(dsn));
}

/**
 * Get client side Sentry settings to inject into the context for the given domain.
 *
 * @param domain The domain name to check.
 * @param sentryDsn The custom Sentry DSN to use.
 * @param sentryEnvironment The custom Sentry environment to use.
 * @returns Sentry DSN and environment if it matches the `--sentry-allowed-domains` option.
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

  try {
    const { origin, pathname, username } = new URL(dsn);

    return {
      sentryDsn: dsn,
      sentryEnvironment: sentryDsn
        ? sentryEnvironment || undefined
        : argv.sentryEnvironment || undefined,
      sentryOrigin: origin,
      reportUri: `${origin}/api${pathname}/security/?sentry_key=${username}`,
    };
  } catch (error) {
    if (!sentryDsn) {
      throw error;
    }

    return {};
  }
}

/**
 * Setup Sentry server side.
 *
 * @param sentryDsn The Sentry DSN
 */
export function configureSentry({
  sentryDsn,
  sentryEnvironment,
}: {
  sentryDsn: string;
  sentryEnvironment: string;
}): void {
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: sentryEnvironment,
      release: version,
      integrations: [nodeProfilingIntegration(), Sentry.postgresIntegration()],
      tracesSampleRate: 1,
      profilesSampleRate: 1,
      profileSessionSampleRate: 1,
      profileLifecycle: 'trace',
    });
  }
}
