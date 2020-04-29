import type { Argv } from '../../types';
import kubernetes from './kubernetes';

export interface DNSImplementation {
  add(...domains: string[]): Promise<void>;
  update(oldDomain: string, newDomain: string): Promise<void>;
  remove(domain: string): Promise<void>;
}

export default async function dns(argv: Argv): Promise<DNSImplementation> {
  if (!argv.appDomainStrategy) {
    return null;
  }
  if (argv.appDomainStrategy === 'kubernetes-ingress') {
    return kubernetes(argv);
  }
  throw new Error('Unknown app domain strategy: unknown');
}
