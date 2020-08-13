import { URL } from 'url';

export function sentryDsnToReportUri(dsn: string): string {
  if (!dsn) {
    return null;
  }
  const { host, pathname, protocol, username } = new URL(dsn);
  return `${protocol}//${host}/api${pathname}/security/?sentry_key=${username}`;
}
