import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import { initDB } from '../models/index.js';
import { argv } from '../utils/argv.js';
import { reconcileDNS } from '../utils/dns/index.js';
import { handleDBError } from '../utils/sqlUtils.js';

export const command = 'reconcile-dns';
export const description =
  'Resolve any differences between existing ingresses and configured organization, app, and app collection domains';

export function builder(yargs: Argv): Argv {
  return databaseBuilder(yargs)
    .option('app-domain-strategy', {
      desc: 'How to link app domain names to apps',
      choices: ['kubernetes-ingress'],
    })
    .option('ingress-class-name', {
      desc: 'The class name of the ingresses to create.',
      default: 'nginx',
    })
    .option('ingress-annotations', {
      desc: 'A JSON string representing ingress annotations to add to created ingresses.',
      implies: ['service-name', 'service-port'],
    })
    .option('service-name', {
      desc: 'The name of the service to which the ingress should point if app-domain-strategy is set to kubernetes-ingress',
      implies: ['service-port'],
    })
    .option('service-port', {
      desc: 'The port of the service to which the ingress should point if app-domain-strategy is set to kubernetes-ingress',
      implies: ['service-name'],
    })
    .option('host', {
      desc: 'The external host on which the server is available. This should include the protocol, hostname, and optionally port.',
      required: true,
    });
}
export async function handler(): Promise<void> {
  try {
    initDB({
      host: argv.databaseHost,
      port: argv.databasePort,
      username: argv.databaseUser,
      password: argv.databasePassword,
      database: argv.databaseName,
      ssl: argv.databaseSsl,
      uri: argv.databaseUrl,
    });
  } catch (error: unknown) {
    handleDBError(error as Error);
  }

  await reconcileDNS({ dryRun: true });
}
