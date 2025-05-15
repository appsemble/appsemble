import { configureLogger, handleError } from '@appsemble/node-utils';
import yargs, { type CommandModule } from 'yargs';

import * as build from './commands/build.js';
import * as cleanupEnvironments from './commands/cleanup-environments.js';
import * as dockerMetadata from './commands/docker-metadata.js';
import * as extractMessages from './commands/extract-messages.js';
import * as getReleaseNotes from './commands/get-release-notes.js';
import * as githubRelease from './commands/github-release.js';
import * as gitlabRelease from './commands/gitlab-release.js';
import * as release from './commands/release.js';
import * as rewriteMessages from './commands/rewrite-messages.js';
import * as seedAccount from './commands/seed-account.js';
import * as seedSubscription from './commands/seed-subscription.js';
import * as twitter from './commands/twitter.js';
import * as validateDocs from './commands/validate-docs.js';
import * as validatePackagedExports from './commands/validate-packaged-exports.js';
import * as validate from './commands/validate.js';
import * as waitForApi from './commands/wait-for-api.js';
import * as waitForSsl from './commands/wait-for-ssl.js';

yargs()
  .option('verbose', {
    alias: 'v',
    describe: 'Increase verbosity',
    type: 'count',
  })
  .option('quiet', {
    alias: 'q',
    describe: 'Decrease verbosity',
    type: 'count',
  })
  .middleware([configureLogger])
  .command(build as unknown as CommandModule)
  .command(cleanupEnvironments)
  .command(dockerMetadata)
  .command(extractMessages)
  .command(getReleaseNotes)
  .command(githubRelease)
  .command(gitlabRelease)
  .command(release as unknown as CommandModule)
  .command(rewriteMessages)
  .command(seedAccount as unknown as CommandModule)
  .command(seedSubscription as unknown as CommandModule)
  .command(twitter)
  .command(validatePackagedExports as unknown as CommandModule)
  .command(validateDocs as unknown as CommandModule)
  .command(validate)
  .command(waitForApi)
  .command(waitForSsl)
  .demandCommand(1)
  .fail(handleError)
  .help()
  .completion()
  .parse(process.argv.slice(2));
