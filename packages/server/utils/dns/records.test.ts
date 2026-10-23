import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createDNSRecords, deleteDNSRecords } from './records.js';
import { setArgv } from '../argv.js';

const mock = new MockAdapter(axios as ConstructorParameters<typeof MockAdapter>[0]);

/**
 * Configure the DNS provider through the command line arguments.
 *
 * @param options The DNS related command line arguments to set.
 */
function setDNSArgv(options: {
  dnsProvider?: string;
  dnsTargets?: string;
  dnsToken?: string;
  dnsZone?: string;
}): void {
  setArgv({
    dnsProvider: undefined,
    dnsTargets: undefined,
    dnsToken: undefined,
    dnsZone: undefined,
    ...options,
  });
}

describe('records', () => {
  beforeEach(() => {
    mock.reset();
    setDNSArgv({
      dnsProvider: 'desec',
      dnsTargets: '203.0.113.10,2001:db8::10',
      dnsToken: 'test.token',
      dnsZone: 'host.example',
    });
  });

  afterEach(() => {
    setDNSArgv({});
  });

  describe('createDNSRecords', () => {
    it('should point the host names at the configured targets', async () => {
      mock.onPatch(/.*/).reply(200, []);

      await createDNSRecords(['*.testorg.host.example', 'testorg.host.example']);

      expect(mock.history.patch).toHaveLength(1);
      const [request] = mock.history.patch;
      expect(request.url).toBe('https://desec.io/api/v1/domains/host.example/rrsets/');
      expect(request.headers?.authorization).toBe('Token test.token');
      expect(JSON.parse(request.data)).toStrictEqual([
        { subname: '*.testorg', type: 'A', ttl: 3600, records: ['203.0.113.10'] },
        { subname: '*.testorg', type: 'AAAA', ttl: 3600, records: ['2001:db8::10'] },
        { subname: 'testorg', type: 'A', ttl: 3600, records: ['203.0.113.10'] },
        { subname: 'testorg', type: 'AAAA', ttl: 3600, records: ['2001:db8::10'] },
      ]);
    });

    it('should use an empty name for the zone itself', async () => {
      mock.onPatch(/.*/).reply(200, []);

      await createDNSRecords(['host.example']);

      expect(JSON.parse(mock.history.patch[0].data)).toStrictEqual([
        { subname: '', type: 'A', ttl: 3600, records: ['203.0.113.10'] },
        { subname: '', type: 'AAAA', ttl: 3600, records: ['2001:db8::10'] },
      ]);
    });

    it('should only create records for the configured address families', async () => {
      setDNSArgv({
        dnsProvider: 'desec',
        dnsTargets: '203.0.113.10',
        dnsToken: 'test.token',
        dnsZone: 'host.example',
      });
      mock.onPatch(/.*/).reply(200, []);

      await createDNSRecords(['testorg.host.example']);

      expect(JSON.parse(mock.history.patch[0].data)).toStrictEqual([
        { subname: 'testorg', type: 'A', ttl: 3600, records: ['203.0.113.10'] },
      ]);
    });

    it('should ignore whitespace around the configured targets', async () => {
      setDNSArgv({
        dnsProvider: 'desec',
        dnsTargets: '203.0.113.10, 2001:db8::10',
        dnsToken: 'test.token',
        dnsZone: 'host.example',
      });
      mock.onPatch(/.*/).reply(200, []);

      await createDNSRecords(['testorg.host.example']);

      expect(JSON.parse(mock.history.patch[0].data)).toStrictEqual([
        { subname: 'testorg', type: 'A', ttl: 3600, records: ['203.0.113.10'] },
        { subname: 'testorg', type: 'AAAA', ttl: 3600, records: ['2001:db8::10'] },
      ]);
    });

    it('should send the records in chunks the API accepts', async () => {
      mock.onPatch(/.*/).reply(200, []);

      await createDNSRecords(
        Array.from({ length: 200 }, (...[, index]) => `org${index}.host.example`),
      );

      expect(mock.history.patch.map(({ data }) => JSON.parse(data).length)).toStrictEqual([
        250, 150,
      ]);
    });

    it('should fail promptly when deSEC requests a day-long rate limit backoff', async () => {
      mock
        .onPatch(/.*/)
        .reply(429, { detail: 'Request was throttled.' }, { 'retry-after': '86400' });

      await expect(createDNSRecords(['testorg.host.example'])).rejects.toThrow(
        'Request failed with status code 429',
      );
    }, 1000);

    it('should not write records if no DNS provider is configured', async () => {
      setDNSArgv({});
      mock.onPatch(/.*/).reply(200, []);

      await createDNSRecords(['testorg.host.example']);

      expect(mock.history.patch).toHaveLength(0);
    });

    it('should throw if the DNS provider is unknown', async () => {
      setDNSArgv({ dnsProvider: 'unknown' });

      await expect(createDNSRecords(['testorg.host.example'])).rejects.toThrow(
        "Unknown DNS provider: 'unknown'",
      );
    });

    it('should throw if a host name is outside of the configured zone', async () => {
      await expect(createDNSRecords(['testorg.other.example'])).rejects.toThrow(
        'Host name testorg.other.example is not part of DNS zone host.example',
      );
    });
  });

  describe('deleteDNSRecords', () => {
    it('should remove the records of the host names', async () => {
      mock.onPatch(/.*/).reply(200, []);

      await deleteDNSRecords(['*.testorg.host.example', 'testorg.host.example']);

      expect(JSON.parse(mock.history.patch[0].data)).toStrictEqual([
        { subname: '*.testorg', type: 'A', ttl: 3600, records: [] },
        { subname: '*.testorg', type: 'AAAA', ttl: 3600, records: [] },
        { subname: 'testorg', type: 'A', ttl: 3600, records: [] },
        { subname: 'testorg', type: 'AAAA', ttl: 3600, records: [] },
      ]);
    });

    it('should not write records if no DNS provider is configured', async () => {
      setDNSArgv({});
      mock.onPatch(/.*/).reply(200, []);

      await deleteDNSRecords(['testorg.host.example']);

      expect(mock.history.patch).toHaveLength(0);
    });
  });
});
