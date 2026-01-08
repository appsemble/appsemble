/**
 * SSRF (Server-Side Request Forgery) protection tests for the request action.
 *
 * These tests verify that the request action properly blocks requests to:
 * - Private IP addresses (127.0.0.1, 10.x.x.x, 192.168.x.x, etc.)
 * - Link-local addresses (169.254.x.x - cloud metadata endpoints)
 * - IPv6 loopback and mapped addresses
 *
 * These tests use integration testing through the real Koa server because
 * axios-mock-adapter intercepts requests at the adapter level, before the
 * HTTP agents (RequestFilteringHttpAgent) are ever invoked.
 */
import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

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
