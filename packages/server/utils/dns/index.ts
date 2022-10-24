import { inspect } from 'util';

import { AppsembleError } from '@appsemble/node-utils';
import { SSLStatusMap } from '@appsemble/types';
import { Promisable } from 'type-fest';

import { argv } from '../argv.js';
import * as kubernetes from './kubernetes.js';

// eslint-disable-next-line jsdoc/require-returns-check
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

/**
 * Get the SSL status for all given domain names.
 *
 * If no implementation exists, a status of `unknown` is returned.
 *
 * @param domains The domain names to get a status for.
 * @returns A mapping of domain names to the status of the SSL certificate.
 */
export function getSSLStatus(domains: string[]): Promisable<SSLStatusMap> {
  const implementation = getImplementation();
  if (implementation) {
    return implementation.getSSLStatus(domains);
  }
  return Object.fromEntries(domains.map((domain) => [domain, 'unknown']));
}
