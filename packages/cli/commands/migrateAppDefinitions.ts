import { opendirSafe } from '@appsemble/node-utils';
import fg from 'fast-glob';
import normalizePath from 'normalize-path';
import { type Argv } from 'yargs';

import { serverImport } from '../lib/serverImport.js';
import { type BaseArguments } from '../types.js';

export const command = 'migrate-app-definitions';
export const description = 'Migrate all app definitions in the Appsemble database.';

interface AdditionalArguments {
  validate?: boolean;
  save?: boolean;
  path?: string;
  batch?: number;
}

export function builder(yargs: Argv): Argv<any> {
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
      conflicts: ['database-host', 'database-name', 'database-user', 'database-password'],
    })
    .option('path', {
      describe: 'The path to the local apps directory.',
    })
    .option('validate', {
      desc: 'Whether to validate the definitions before saving.',
      type: 'boolean',
      default: true,
    })
    .option('save', {
      desc: 'Whether to save the changes.',
      type: 'boolean',
      default: false,
    })
    .option('batch', {
      desc: 'The batch size of apps to patch at once.',
      type: 'number',
      default: 100,
    });
}

export async function handler({
  batch,
  path,
  save,
  validate,
  ...argv
}: AdditionalArguments & BaseArguments): Promise<void> {
  const { migrateAppDefinitions, setArgv } = await serverImport('setArgv', 'migrateAppDefinitions');
  setArgv(argv);

  const paths: string[] = [];

  if (path) {
    const normalizedPath = normalizePath(path);
    const directories = await fg(`${normalizedPath}/*`, { absolute: true, onlyDirectories: true });
    for (const dir of directories) {
      await opendirSafe(dir, (filepath, filestat) => {
        if (filestat.isFile() && filestat.name.toLowerCase() === 'app-definition.yaml') {
          paths.push(filepath);
        }
      });
    }
  }
  return migrateAppDefinitions({ save, paths, validate, batch });
}
