import { type Argv } from 'yargs';

export function databaseBuilder(yargs: Argv): Argv {
  const production = process.env.NODE_ENV === 'production';
  return yargs
    .option('database-host', {
      desc: 'The host of the database to connect to. This defaults to the connected database container.',
    })
    .option('database-port', {
      desc: 'The port of the database to connect to.',
      type: 'number',
      default: 5432,
    })
    .option('database-ssl', {
      desc: 'Use SSL to connect to the database.',
      type: 'boolean',
    })
    .option('database-name', {
      desc: 'The name of the database to connect to.',
      implies: ['database-user', 'database-password'],
    })
    .option('database-user', {
      desc: 'The user to use to login to the database.',
      implies: ['database-name', 'database-password'],
    })
    .option('database-password', {
      desc: 'The password to use to login to the database.',
      implies: ['database-name', 'database-user'],
    })
    .option('database-url', {
      desc: 'A connection string for the database to connect to. This is an alternative to the separate database related variables.',
      conflicts: [
        'database-host',
        production && 'database-name',
        production && 'database-user',
        production && 'database-password',
      ].filter((x) => x !== false),
    })
    .option('database-benchmark', {
      desc: 'Enable Sequelize benchmark mode to log query execution times.',
      type: 'boolean',
      default: false,
    })
    .option('slow-query-threshold', {
      desc: 'Threshold in milliseconds above which queries are logged as warnings.',
      type: 'number',
      default: 100,
    })
    .option('app-db-cache-limit', {
      desc: 'The maximum number of app databases to keep cached. The least recently used app database connection is closed and evicted when the limit is exceeded.',
      type: 'number',
      default: 200,
    })
    .option('s3-host', {
      desc: 'The host of the Amazon S3 compatible object storage server',
    })
    .option('s3-port', {
      desc: 'The port of the Amazon S3 compatible object storage server',
      type: 'number',
      default: 9000,
    })
    .option('s3-secure', {
      desc: 'Whether ssl should be used for the Amazon S3 compatible object storage server',
      type: 'boolean',
      default: true,
    })
    .option('s3-access-key', {
      desc: 'The access key of the Amazon S3 compatible object storage server',
    })
    .option('s3-secret-key', {
      desc: 'The secret key of the Amazon S3 compatible object storage server',
    })
    .option('valkey-host', {
      desc: 'The host of the Valkey server to connect to.',
    })
    .option('valkey-port', {
      desc: 'The port of the Valkey server to connect to.',
      type: 'number',
      default: 6379,
    })
    .option('valkey-username', {
      desc: 'The username to use to login to the Valkey server.',
      default: 'default',
    })
    .option('valkey-password', {
      desc: 'The password to use to login to the Valkey server.',
    })
    .option('valkey-tls', {
      desc: 'Use TLS when connecting to the Valkey server.',
      type: 'boolean',
      default: false,
    })
    .option('app-serving-cache-ttl', {
      desc: 'The TTL in seconds for cached app-serving metadata. Set to 0 to disable the cache.',
      type: 'number',
      default: 300,
    });
}
