import { inspect } from 'util';

import { AppsembleError } from '@appsemble/node-utils';

import { argv } from '../argv';
import * as kubernetes from './kubernetes';

/**
 * Get the DNS implementation for the specified app domain strategy.
 *
 * @returns An implementation for the given `--app-domain-strategy` flag.
 */
function getImplementation(): typeof import('.') {
  const { appDomainStrategy } = argv;
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
 */
export async function configureDNS(): Promise<void> {
  await getImplementation()?.configureDNS();
}

/**
 * Cleanup the DNS settings in the running environment.
 */
export async function cleanupDNS(): Promise<void> {
  await getImplementation()?.cleanupDNS();
}

/**
 * Restore the DNS settings for the running environment.
 */
export async function restoreDNS(): Promise<void> {
  await getImplementation()?.restoreDNS();
}
