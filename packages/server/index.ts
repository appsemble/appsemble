import './types.js';

/**
 * These are exported, so @appsemble/cli can wrap them.
 */
export { setArgv } from './utils/argv.js';
export { handler as start } from './commands/start.js';
export { handler as migrate } from './commands/migrate.js';
export { handler as cleanupResourcesAndAssets } from './commands/cleanupResourcesAndAssets.js';
export { handler as cleanupDemoUsers } from './commands/cleanupDemoUsers.js';
export { handler as checkMigrations } from './commands/checkMigrations.js';
export { handler as runCronJobs } from './commands/runCronJobs.js';

/**
 * These are exported, so @appsemble/cli can use them for integration testing.
 */
export { useTestDatabase } from './utils/test/testSchema.js';
export { authorizeClientCredentials, createTestUser } from './utils/test/authorization.js';
export { createServer } from './utils/createServer.js';
export * as models from './models/index.js';
