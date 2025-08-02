import { configureSentry } from './utils/sentry.js';

if (process.env.SENTRY_DSN !== undefined) {
  configureSentry({
    sentryEnvironment: process.env.SENTRY_ENVIRONMENT,
    sentryDsn: process.env.SENTRY_DSN,
  });
}
