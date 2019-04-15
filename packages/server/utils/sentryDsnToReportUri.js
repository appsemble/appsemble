export default function sentryDsnToReportUri(dsn) {
  if (!dsn) {
    return null;
  }
  const { protocol, username, host, pathname } = new URL(dsn);
  return `${protocol}//${host}/api${pathname}/security/?sentry_key=${username}`;
}
