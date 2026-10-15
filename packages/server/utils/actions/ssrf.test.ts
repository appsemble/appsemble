/**
 * SSRF (Server-Side Request Forgery) protection tests for the request action.
 *
 * These tests verify that the request action properly blocks requests to:
 * - Private IP addresses (127.0.0.1, 10.x.x.x, 192.168.x.x, etc.)
 * - Link-local addresses (169.254.x.x - cloud metadata endpoints)
 * - IPv6 loopback and mapped addresses
 * - Hostnames that resolve to private addresses, and redirects to private addresses
 *
 * These tests use integration testing through the real Koa server because
 * axios-mock-adapter intercepts requests at the adapter level, before the
 * HTTP agents (RequestFilteringHttpAgent) are ever invoked.
 */
import dns, { type LookupAddress, type LookupOptions } from 'node:dns';
import { createServer as createHttpServer, type Server } from 'node:http';
import { syncBuiltinESMExports } from 'node:module';
import { type AddressInfo } from 'node:net';

import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { App, Organization } from '../../models/index.js';
import { setArgv } from '../argv.js';
import { createServer } from '../createServer.js';
import { createTestUser } from '../test/authorization.js';

// Disable the test-only private IP allowance so we can verify SSRF protection works.
// vitest.setup.ts sets VITEST_CONF_ALLOW_PRIVATE_IP_PROXY=1 for other proxy tests.
beforeAll(() => {
  delete process.env.VITEST_CONF_ALLOW_PRIVATE_IP_PROXY;
});

let server: Koa;
const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };

describe('request action SSRF protection', () => {
  beforeEach(async () => {
    setArgv(argv);
    await createTestUser();
    server = await createServer({});
    await setTestApp(server);
  });

  const createAppWithAction = async (actionName: string, url: string): Promise<void> => {
    await Organization.create({ id: 'testorg' });
    await App.create({
      vapidPublicKey: '',
      vapidPrivateKey: '',
      OrganizationId: 'testorg',
      definition: {
        name: 'SSRF Test App',
        defaultPage: '',
        pages: [
          {
            name: '',
            blocks: [
              {
                type: '',
                version: '',
                actions: {
                  [actionName]: {
                    type: 'request',
                    url,
                  },
                },
              },
            ],
          },
        ],
      },
    } as Partial<App>);
  };

  describe('Direct Private IP Access', () => {
    it('should block requests to localhost (127.0.0.1)', async () => {
      await createAppWithAction('ssrfLocalhost', 'http://127.0.0.1:8080/api');

      const response = await request.get(
        '/api/apps/1/actions/pages.0.blocks.0.actions.ssrfLocalhost?data={}',
      );

      expect(response.status).toBe(403);
      expect(response.data.message).toMatch(/private|not allowed/i);
    });

    it('should block requests to private IP 10.0.0.1', async () => {
      await createAppWithAction('ssrfPrivate10', 'http://10.0.0.1:8080/internal');

      const response = await request.get(
        '/api/apps/1/actions/pages.0.blocks.0.actions.ssrfPrivate10?data={}',
      );

      expect(response.status).toBe(403);
      expect(response.data.message).toMatch(/private|blocked|not allowed/i);
    });

    it('should block requests to private IP 192.168.1.1', async () => {
      await createAppWithAction('ssrfPrivate192', 'http://192.168.1.1/admin');

      const response = await request.get(
        '/api/apps/1/actions/pages.0.blocks.0.actions.ssrfPrivate192?data={}',
      );

      expect(response.status).toBe(403);
      expect(response.data.message).toMatch(/private|blocked|not allowed/i);
    });

    it('should block requests to private IP 172.16.0.1', async () => {
      await createAppWithAction('ssrfPrivate172', 'http://172.16.0.1:3000/api');

      const response = await request.get(
        '/api/apps/1/actions/pages.0.blocks.0.actions.ssrfPrivate172?data={}',
      );

      expect(response.status).toBe(403);
      expect(response.data.message).toMatch(/private|blocked|not allowed/i);
    });

    it('should block requests to cloud metadata endpoint (169.254.169.254)', async () => {
      await createAppWithAction('ssrfMetadata', 'http://169.254.169.254/latest/meta-data/');

      const response = await request.get(
        '/api/apps/1/actions/pages.0.blocks.0.actions.ssrfMetadata?data={}',
      );

      expect(response.status).toBe(403);
      expect(response.data.message).toMatch(/private|blocked|not allowed/i);
    });

    it('should block NAT64 synthesized private IPv4 addresses (64:ff9b::127.0.0.1)', async () => {
      // 127.0.0.1 in hex is 7f00:0001
      await createAppWithAction('ssrfNAT64Private', 'http://[64:ff9b::7f00:0001]:8080/');

      const response = await request.get(
        '/api/apps/1/actions/pages.0.blocks.0.actions.ssrfNAT64Private?data={}',
      );

      expect(response.status).toBe(403);
      expect(response.data.message).toMatch(/private|blocked|not allowed/i);
    });
  });

  describe('IPv6 Bypass Attempts', () => {
    it('should block IPv6 loopback (::1)', async () => {
      await createAppWithAction('ssrfIPv6Loopback', 'http://[::1]:8080/');

      const response = await request.get(
        '/api/apps/1/actions/pages.0.blocks.0.actions.ssrfIPv6Loopback?data={}',
      );

      expect(response.status).toBe(403);
      expect(response.data.message).toMatch(/private|blocked|not allowed/i);
    });

    it('should block IPv4-mapped IPv6 addresses (::ffff:127.0.0.1)', async () => {
      await createAppWithAction('ssrfIPv6Mapped', 'http://[::ffff:127.0.0.1]:8080/');

      const response = await request.get(
        '/api/apps/1/actions/pages.0.blocks.0.actions.ssrfIPv6Mapped?data={}',
      );

      expect(response.status).toBe(403);
      expect(response.data.message).toMatch(/private|blocked|not allowed/i);
    });
  });

  describe('Indirect Private IP Access', () => {
    let target: Server;
    let targetRequests: number;

    const listen = (httpServer: Server, host: string): Promise<number> =>
      new Promise((resolve) => {
        httpServer.listen(0, host, () => resolve((httpServer.address() as AddressInfo).port));
      });

    beforeEach(() => {
      targetRequests = 0;
      target = createHttpServer((req, res) => {
        targetRequests += 1;
        res.end('internal');
      });
    });

    afterEach(() => {
      target.close();
      vi.restoreAllMocks();
      syncBuiltinESMExports();
      vi.unstubAllEnvs();
    });

    it('should block a hostname that resolves to a private IP', async () => {
      const port = await listen(target, '127.0.0.1');
      const { lookup } = dns;
      vi.spyOn(dns, 'lookup').mockImplementation(((
        hostname: string,
        options: LookupOptions,
        callback: (err: Error | null, address: LookupAddress[] | string, family?: number) => void,
      ) => {
        if (hostname !== 'internal.example') {
          // Node.js connects using the callback API, so the mock forwards to it.
          // eslint-disable-next-line n/prefer-promises/dns
          return lookup(hostname, options, callback);
        }
        if (options.all) {
          return callback(null, [{ address: '127.0.0.1', family: 4 }]);
        }
        return callback(null, '127.0.0.1', 4);
      }) as typeof dns.lookup);
      // The SSRF agent imports `node:dns` as an ES module.
      syncBuiltinESMExports();
      await createAppWithAction('ssrfHostname', `http://internal.example:${port}/`);

      const response = await request.get(
        '/api/apps/1/actions/pages.0.blocks.0.actions.ssrfHostname?data={}',
      );

      expect(response.status).toBe(403);
      expect(targetRequests).toBe(0);
    });

    it('should block a redirect from an allowed host to a private IP', async () => {
      const port = await listen(target, '127.0.0.1');
      const redirect = createHttpServer((req, res) => {
        res.writeHead(302, { location: `http://127.0.0.1:${port}/` });
        res.end();
      });
      const redirectPort = await listen(redirect, '127.0.0.2');
      vi.stubEnv('SSRF_ALLOW_IP_ADDRESS_LIST', '127.0.0.2');
      await createAppWithAction('ssrfRedirect', `http://127.0.0.2:${redirectPort}/`);

      const response = await request.get(
        '/api/apps/1/actions/pages.0.blocks.0.actions.ssrfRedirect?data={}',
      );
      redirect.close();

      expect(response.status).toBe(403);
      expect(targetRequests).toBe(0);
    });
  });

  describe('Legitimate Public URLs', () => {
    it('should allow requests to public URLs', async () => {
      await createAppWithAction('publicUrl', 'https://httpbin.org/get');

      const response = await request.get(
        '/api/apps/1/actions/pages.0.blocks.0.actions.publicUrl?data={}',
      );

      // Should succeed (200) or at least not be blocked (not 403)
      expect(response.status).not.toBe(403);
    });
  });
});
