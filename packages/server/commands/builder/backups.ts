import { type Argv } from 'yargs';

export function backupsBuilder(yargs: Argv): Argv {
  return yargs
    .option('backups-region', {
      desc: 'The region to sign requests to the Amazon S3 compatible object storage server for the backups for',
      default: 'us-east-1',
    })
    .option('backups-path-style', {
      desc: 'Whether to address the backups bucket in the URL path instead of as a subdomain of the endpoint',
      type: 'boolean',
      default: true,
    });
}
