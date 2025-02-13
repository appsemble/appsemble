import './types.js';

/**
 * These are exported, so @appsemble/cli can wrap them.
 */
export { setArgv } from './utils/argv.js';
export { handler as start } from './commands/start.js';
export { handler as migrate } from './commands/migrate.js';
export { handler as migrateAppDefinitions } from './commands/migrateAppDefinitions.js';
export { handler as cleanupResourcesAndAssets } from './commands/cleanupResourcesAndAssets.js';
export { handler as cleanupDemoAppMembers } from './commands/cleanupDemoAppMembers.js';
export { handler as cleanupSoftDeletedRecords } from './commands/cleanupSoftDeletedRecords.js';
export { handler as checkMigrations } from './commands/checkMigrations.js';
export { handler as checkDownMigrations } from './commands/checkDownMigrations.js';
export { handler as runCronJobs } from './commands/runCronJobs.js';
export { handler as scaleContainers } from './commands/scaleContainers.js';
export { handler as fuzzMigrations } from './commands/fuzzMigrations.js';
export { handler as synchronizeTrainings } from './commands/synchronizeTrainings.js';

/**
 * These are exported, so @appsemble/cli can use them for integration testing.
 */
export { setupTestDatabase, rootDB } from './utils/test/testSchema.js';
export {
  authorizeClientCredentials,
  createTestAppMember,
  createTestUser,
} from './utils/test/authorization.js';
export { createServer } from './utils/createServer.js';
export * as models from './models/index.js';
