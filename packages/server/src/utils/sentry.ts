import { URL } from 'url';

import { init } from '@sentry/node';

import { argv } from './argv';
import { readPackageJson } from './readPackageJson';

interface SentrySettings {
  reportUri: string;
  origin: string;
}

export function sentryDsnToReportUri(dsn: string): SentrySettings | undefined {
  if (!dsn) {
    return;
  }
  const { origin, pathname, username } = new URL(dsn);
  return { origin, reportUri: `${origin}/api${pathname}/security/?sentry_key=${username}` };
}

export function configureSentry(): void {
  if (argv.sentryDsn) {
    const { version } = readPackageJson();
    init({ dsn: argv.sentryDsn, environment: argv.sentryEnvironment, release: version });
  }
}
