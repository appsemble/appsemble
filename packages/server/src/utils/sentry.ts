import { URL } from 'url';

import { init } from '@sentry/node';
import { isMatch } from 'matcher';

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
 * @param domain - The doain name to check.
 * @returns Sentry DSN and environment if it matches the `--sentry-allowed-domains` option.
 */
export function getSentryClientSettings(domain: string): SentrySettings {
  if (
    !argv.sentryDsn ||
    !argv.sentryAllowedDomains ||
    !isMatch(domain, argv.sentryAllowedDomains.split(','))
  ) {
    return {};
  }
  const { origin, pathname, username } = new URL(argv.sentryDsn);
  return {
    sentryDsn: argv.sentryDsn,
    sentryEnvironment: argv.sentryEnvironment,
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
