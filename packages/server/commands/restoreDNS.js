import bulkDNSRestore from '../utils/bulkDNSRestore';
import dns from '../utils/dns';
import setupModels, { handleDbException } from '../utils/setupModels';
import databaseBuilder from './builder/database';

export const command = 'restore-dns';
export const description = 'Restore the app DNS settings from the database in the host platform';

export function builder(yargs) {
  return databaseBuilder(yargs)
    .option('app-domain-strategy', {
      desc: 'How to link app domain names to apps',
      choices: ['kubernetes-ingress'],
    })
    .option('ingress-name', {
      desc: 'The name of the ingress to patch if app-domain-strategy is set to kubernetes-ingress',
      implies: ['ingress-service-name', 'ingress-service-port'],
    })
    .option('ingress-service-name', {
      desc:
        'The name of the service to which the ingress should point if app-domain-strategy is set to kubernetes-ingress',
      implies: ['ingress-name', 'ingress-service-port'],
    })
    .option('ingress-service-port', {
      desc:
        'The port of the service to which the ingress should point if app-domain-strategy is set to kubernetes-ingress',
      implies: ['ingress-name', 'ingress-service-name'],
      type: 'number',
    })
    .option('host', {
      desc:
        'The external host on which the server is available. This should include the protocol, hostname, and optionally port.',
      required: true,
    });
}

export async function handler(argv) {
  let db;

  try {
    db = await setupModels({
      host: argv.databaseHost,
      port: argv.databasePort,
      username: argv.databaseUser,
      password: argv.databasePassword,
      database: argv.databaseName,
      ssl: argv.databaseSsl,
      uri: argv.databaseUrl,
    });
  } catch (dbException) {
    handleDbException(dbException);
  }

  const dnsConfig = await dns(argv);
  await bulkDNSRestore(db, dnsConfig, 50);
}
