import { beforeEach, describe, expect, it, vi } from 'vitest';

import { cleanupDNS, configureDNS, reconcileDNS } from './index.js';
import * as kubernetes from './kubernetes.js';
import { setArgv } from '../argv.js';

describe('dns', () => {
  beforeEach(() => {
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    vi.spyOn(kubernetes, 'configureDNS').mockResolvedValue(null);
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    vi.spyOn(kubernetes, 'cleanupDNS').mockResolvedValue(null);
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    vi.spyOn(kubernetes, 'reconcileDNS').mockResolvedValue(null);
  });

  describe('configureDNS', () => {
    it('should delegate configureDNS to kubernetes if the app domain strategy is kubernetes-ingress', async () => {
      setArgv({ appDomainStrategy: 'kubernetes-ingress' });
      await configureDNS();
      expect(kubernetes.configureDNS).toHaveBeenCalledWith();
    });

    it('should not delegate configureDNS to kubernetes if the app domain strategy is undefined', async () => {
      setArgv({});
      await configureDNS();
      expect(kubernetes.configureDNS).not.toHaveBeenCalled();
    });

    it('should throw if the app domain strategy is unknown', async () => {
      setArgv({ appDomainStrategy: 'unknown' });
      await expect(configureDNS()).rejects.toThrow("Unknown app domain strategy: 'unknown'");
    });
  });

  describe('cleanupDNS', () => {
    it('should delegate cleanupDNS to kubernetes if the app domain strategy is kubernetes-ingress', async () => {
      setArgv({ appDomainStrategy: 'kubernetes-ingress' });
      await cleanupDNS();
      expect(kubernetes.cleanupDNS).toHaveBeenCalledWith();
    });

    it('should not delegate cleanupDNS to kubernetes if the app domain strategy is undefined', async () => {
      setArgv({});
      await cleanupDNS();
      expect(kubernetes.cleanupDNS).not.toHaveBeenCalled();
    });

    it('should throw if the app domain strategy is unknown', async () => {
      setArgv({ appDomainStrategy: 'unknown' });
      await expect(cleanupDNS()).rejects.toThrow("Unknown app domain strategy: 'unknown'");
    });
  });

  describe('reconcileDNS', () => {
    it('should delegate reconcileDNS to kubernetes if the app domain strategy is kubernetes-ingress', async () => {
      setArgv({ appDomainStrategy: 'kubernetes-ingress' });
      await reconcileDNS();
      expect(kubernetes.reconcileDNS).toHaveBeenCalledWith({
        dryRun: true,
        skipCustomDomains: false,
      });
    });

    it('should not delegate reconcileDNS to kubernetes if the app domain strategy is undefined', async () => {
      setArgv({});
      await reconcileDNS();
      expect(kubernetes.reconcileDNS).not.toHaveBeenCalled();
    });

    it('should throw if the app domain strategy is unknown', async () => {
      setArgv({ appDomainStrategy: 'unknown' });
      await expect(reconcileDNS()).rejects.toThrow("Unknown app domain strategy: 'unknown'");
    });
  });
});
