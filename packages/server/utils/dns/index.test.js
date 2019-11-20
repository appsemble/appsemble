import dns from '.';
import * as kubernetes from './kubernetes';

it('should invoke kubernetes if the kubernetes-ingress app domain strategy is used', async () => {
  jest.spyOn(kubernetes, 'default').mockResolvedValue('returnValue');
  const result = await dns({ appDomainStrategy: 'kubernetes-ingress' });
  expect(kubernetes.default).toHaveBeenCalledWith({ appDomainStrategy: 'kubernetes-ingress' });
  expect(result).toBe('returnValue');
});

it('should return null if the app domain strategy is not defined', async () => {
  jest.spyOn(kubernetes, 'default').mockResolvedValue('returnValue');
  const result = await dns({});
  expect(result).toBeNull();
});

it('should throw an error if the app domain strategy is unknown', async () => {
  jest.spyOn(kubernetes, 'default').mockResolvedValue('returnValue');
  await expect(dns({ appDomainStrategy: 'unknown' })).rejects.toThrow(
    'Unknown app domain strategy: unknown',
  );
});
