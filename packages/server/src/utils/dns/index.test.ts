import { cleanupDNS, configureDNS, restoreDNS } from '.';
import * as kubernetes from './kubernetes';

beforeEach(() => {
  jest.spyOn(kubernetes, 'configureDNS').mockResolvedValue(null);
  jest.spyOn(kubernetes, 'cleanupDNS').mockResolvedValue(null);
  jest.spyOn(kubernetes, 'restoreDNS').mockResolvedValue(null);
});

describe('configureDNS', () => {
  it('should delegate configureDNS to kubernetes if the app domain strategy is kubernetes-ingress', async () => {
    await configureDNS({ appDomainStrategy: 'kubernetes-ingress' });
    expect(kubernetes.configureDNS).toHaveBeenCalledWith({
      appDomainStrategy: 'kubernetes-ingress',
    });
  });

  it('should not delegate configureDNS to kubernetes if the app domain strategy is undefined', async () => {
    await configureDNS({});
    expect(kubernetes.configureDNS).not.toHaveBeenCalled();
  });

  it('should throw if the app domain strategy is unknown', async () => {
    await expect(configureDNS({ appDomainStrategy: 'unknown' })).rejects.toThrow(
      "Unknown app domain strategy: 'unknown'",
    );
  });
});

describe('cleanupDNS', () => {
  it('should delegate cleanupDNS to kubernetes if the app domain strategy is kubernetes-ingress', async () => {
    await cleanupDNS({ appDomainStrategy: 'kubernetes-ingress' });
    expect(kubernetes.cleanupDNS).toHaveBeenCalledWith({ appDomainStrategy: 'kubernetes-ingress' });
  });

  it('should not delegate cleanupDNS to kubernetes if the app domain strategy is undefined', async () => {
    await cleanupDNS({});
    expect(kubernetes.cleanupDNS).not.toHaveBeenCalled();
  });

  it('should throw if the app domain strategy is unknown', async () => {
    await expect(cleanupDNS({ appDomainStrategy: 'unknown' })).rejects.toThrow(
      "Unknown app domain strategy: 'unknown'",
    );
  });
});

describe('restoreDNS', () => {
  it('should delegate restoreDNS to kubernetes if the app domain strategy is kubernetes-ingress', async () => {
    await restoreDNS({ appDomainStrategy: 'kubernetes-ingress' });
    expect(kubernetes.restoreDNS).toHaveBeenCalledWith({ appDomainStrategy: 'kubernetes-ingress' });
  });

  it('should not delegate restoreDNS to kubernetes if the app domain strategy is undefined', async () => {
    await restoreDNS({});
    expect(kubernetes.restoreDNS).not.toHaveBeenCalled();
  });

  it('should throw if the app domain strategy is unknown', async () => {
    await expect(restoreDNS({ appDomainStrategy: 'unknown' })).rejects.toThrow(
      "Unknown app domain strategy: 'unknown'",
    );
  });
});
