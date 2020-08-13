import { dns, DNSImplementation } from '.';
import * as kubernetes from './kubernetes';

it('should invoke kubernetes if the kubernetes-ingress app domain strategy is used', async () => {
  const stubDNS: DNSImplementation = {
    add: () => Promise.resolve(),
    update: () => Promise.resolve(),
    remove: () => Promise.resolve(),
  };
  jest.spyOn(kubernetes, 'kubernetes').mockResolvedValue(stubDNS);
  const result = await dns({ host: '', appDomainStrategy: 'kubernetes-ingress' });
  expect(kubernetes.kubernetes).toHaveBeenCalledWith({
    host: '',
    appDomainStrategy: 'kubernetes-ingress',
  });
  expect(result).toBe(stubDNS);
});

it('should return null if the app domain strategy is not defined', async () => {
  const result = await dns({ host: '' });
  expect(result).toBeNull();
});

it('should throw an error if the app domain strategy is unknown', async () => {
  await expect(dns({ host: '', appDomainStrategy: 'unknown' })).rejects.toThrow(
    'Unknown app domain strategy: unknown',
  );
});
