import { configureLogger, handleError } from '@appsemble/node-utils';
import yargs from 'yargs';

import * as build from './commands/build';
import * as cleanupEnvironments from './commands/cleanup-environments';
import * as dockerMetadata from './commands/docker-metadata';
import * as extractMessages from './commands/extract-messages';
import * as getReleaseNotes from './commands/get-release-notes';
import * as githubRelease from './commands/github-release';
import * as gitlabRelease from './commands/gitlab-release';
import * as release from './commands/release';
import * as rewriteMessages from './commands/rewrite-messages';
import * as twitter from './commands/twitter';
import * as validate from './commands/validate';
import * as waitForApi from './commands/wait-for-api';
import * as waitForSsl from './commands/wait-for-ssl';

yargs
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
  .command(build)
  .command(cleanupEnvironments)
  .command(dockerMetadata)
  .command(extractMessages)
  .command(getReleaseNotes)
  .command(githubRelease)
  .command(gitlabRelease)
  .command(release)
  .command(rewriteMessages)
  .command(twitter)
  .command(validate)
  .command(waitForApi)
  .command(waitForSsl)
  .demandCommand(1)
  .fail(handleError)
  .help()
  .completion()
  .parse(process.argv.slice(2));
