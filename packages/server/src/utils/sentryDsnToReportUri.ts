import { URL } from 'url';

interface SentrySettings {
  reportUri: string;
  origin: string;
}

export function sentryDsnToReportUri(dsn: string): undefined | SentrySettings {
  if (!dsn) {
    return;
  }
  const { origin, pathname, username } = new URL(dsn);
  return { origin, reportUri: `${origin}/api${pathname}/security/?sentry_key=${username}` };
}
