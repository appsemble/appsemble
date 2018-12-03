const regex = /(https?):\/\/([\w]+)@([\w.]+)\/(\d+)/;

export default function sentryDsnToReportUri(dsn) {
  if (!dsn) {
    return null;
  }
  const [, protocol, pubKey, host, id] = dsn.match(regex);
  return `${protocol}://${host}/api/${id}/security/?sentry_key=${pubKey}`;
}
