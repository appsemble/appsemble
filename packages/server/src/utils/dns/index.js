import kubernetes from './kubernetes';

export default async function dns(argv) {
  if (!argv.appDomainStrategy) {
    return null;
  }
  if (argv.appDomainStrategy === 'kubernetes-ingress') {
    return kubernetes(argv);
  }
  throw new Error('Unknown app domain strategy: unknown');
}
