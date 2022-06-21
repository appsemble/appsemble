import { init } from '@sentry/node';
import matcher from 'matcher';

import { argv } from './argv';
import { readPackageJson } from './readPackageJson';

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
 * Get client side Sentry settings to inject into the context for the given domain.
 *
 * @param domain - The domain name to check.
 * @param sentryDsn - The custom Sentry DSN to use.
 * @param sentryEnvironment - The custom Sentry environment to use.
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
 * Setup Sentry server side.
 */
export function configureSentry(): void {
  if (argv.sentryDsn) {
    const { version } = readPackageJson();
    init({ dsn: argv.sentryDsn, environment: argv.sentryEnvironment, release: version });
  }
}
