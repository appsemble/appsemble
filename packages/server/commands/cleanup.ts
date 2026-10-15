import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import { initDB } from '../models/index.js';
import { argv } from '../utils/argv.js';
import { cleanupDNS } from '../utils/dns/index.js';
import { handleDBError } from '../utils/sqlUtils.js';

export const command = 'cleanup';
export const description = 'Restore the app DNS settings from the database in the host platform';

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
    .option('dns-provider', {
      desc: 'The provider which serves the DNS zone of the deployment.',
      choices: ['desec'],
      implies: ['dns-zone', 'dns-token', 'dns-targets'],
    })
    .option('dns-zone', {
      desc: 'The name of the DNS zone which contains the organization host names.',
    })
    .option('dns-token', {
      desc: 'The token used to authenticate with the API of the DNS provider.',
    })
    .option('dns-targets', {
      desc: 'The IP addresses the organization host names resolve to, comma separated.',
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

  await cleanupDNS();
  process.exit();
}
