import { inspect } from 'util';

import { AppsembleError } from '@appsemble/node-utils';

import type { Argv } from '../../types';
import * as kubernetes from './kubernetes';

/**
 * Get the DNS implementation for the specified app domain strategy.
 *
 * @param argv - The parsed command line parameters.
 *
 * @returns An implementation for the given `--app-domain-strategy` flag.
 */
function getImplementation({ appDomainStrategy }: Argv): typeof import('.') {
  if (!appDomainStrategy) {
    return;
  }

  if (appDomainStrategy === 'kubernetes-ingress') {
    return kubernetes;
  }

  throw new AppsembleError(`Unknown app domain strategy: ${inspect(appDomainStrategy)}`);
}

/**
 * Configure DNS for a running deployment.
 *
 * @param argv - The parsed command line parameters.
 */
export async function configureDNS(argv: Argv): Promise<void> {
  await getImplementation(argv)?.configureDNS(argv);
}

/**
 * Cleanup the DNS settings in the running environment.
 *
 * @param argv - The parsed command line parameters.
 */
export async function cleanupDNS(argv: Argv): Promise<void> {
  await getImplementation(argv)?.cleanupDNS(argv);
}

/**
 * Restore the DNS settings for the running environment.
 *
 * @param argv - The parsed command line parameters.
 */
export async function restoreDNS(argv: Argv): Promise<void> {
  await getImplementation(argv)?.restoreDNS(argv);
}
