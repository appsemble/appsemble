/**
 * SSRF (Server-Side Request Forgery) vulnerability tests.
 *
 * These tests verify that the proxy handler properly blocks requests to:
 * - Private IP addresses (127.0.0.1, 10.x.x.x, 192.168.x.x, etc.)
 * - Link-local addresses (169.254.x.x - cloud metadata endpoints)
 * - Kubernetes internal hostnames (*.svc.cluster.local)
 * - Cross-app container access (app trying to access another app's container)
 */
import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { App, Organization } from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import { createTestUser } from '../../../utils/test/authorization.js';

// Disable the test-only private IP allowance so we can verify SSRF protection works.
// vitest.setup.ts sets VITEST_CONF_ALLOW_PRIVATE_IP_PROXY=1 for other proxy tests.
beforeAll(() => {
  delete process.env.VITEST_CONF_ALLOW_PRIVATE_IP_PROXY;
});

let server: Koa;
const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };

describe('SSRF Protection', () => {
  beforeEach(async () => {
    setArgv(argv);
    await createTestUser();
    server = await createServer({});
    await setTestApp(server);
  });

  describe('Existing Container Protection (should pass)', () => {
    it('should block requests to another apps companion container (app ID mismatch)', async () => {
      // This tests the EXISTING protection in the codebase
      // App 1 tries to access a container belonging to app 999 - should be blocked
      await Organization.create({ id: 'org' });
      await App.create({
        vapidPublicKey: '',
        vapidPrivateKey: '',
        OrganizationId: 'org',
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
                    crossAppContainer: {
                      type: 'request',
                      // App ID 1 trying to access container for app ID 999
                      url: 'http://my-container-someapp-999.companion-containers.svc.cluster.local/api',
                    },
                  },
                },
              ],
            },
          ],
        },
      } as Partial<App>);

      const response = await request.get(
        '/api/apps/1/actions/pages.0.blocks.0.actions.crossAppContainer?data={}',
      );

      // This should return 403 Forbidden due to existing app ID check
      expect(response.status).toBe(403);
      expect(response.data.message).toBe('Forbidden');
    });
  });

  describe('Direct Private IP Access', () => {
    it('should block requests to localhost (127.0.0.1)', async () => {
      await Organization.create({ id: 'org' });
      await App.create({
        vapidPublicKey: '',
        vapidPrivateKey: '',
        OrganizationId: 'org',
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
                    ssrfLocalhost: {
                      type: 'request',
                      url: 'http://127.0.0.1:8080/api',
                    },
                  },
                },
              ],
            },
          ],
        },
      } as Partial<App>);

      const response = await request.get(
        '/api/apps/1/actions/pages.0.blocks.0.actions.ssrfLocalhost?data={}',
      );

      // SSRF protection should block this with 403
      expect(response.status).toBe(403);
      expect(response.data.message).toMatch(/private|not allowed/i);
    });

    it('should block requests to private IP 10.0.0.1', async () => {
      await Organization.create({ id: 'org' });
      await App.create({
        vapidPublicKey: '',
        vapidPrivateKey: '',
        OrganizationId: 'org',
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
                    ssrfPrivate10: {
                      type: 'request',
                      url: 'http://10.0.0.1:8080/internal',
                    },
                  },
                },
              ],
            },
          ],
        },
      } as Partial<App>);

      const response = await request.get(
        '/api/apps/1/actions/pages.0.blocks.0.actions.ssrfPrivate10?data={}',
      );

      expect(response.status).toBe(403);
      expect(response.data.message).toMatch(/private|blocked|not allowed/i);
    });

    it('should block requests to private IP 192.168.1.1', async () => {
      await Organization.create({ id: 'org' });
      await App.create({
        vapidPublicKey: '',
        vapidPrivateKey: '',
        OrganizationId: 'org',
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
                    ssrfPrivate192: {
                      type: 'request',
                      url: 'http://192.168.1.1/admin',
                    },
                  },
                },
              ],
            },
          ],
        },
      } as Partial<App>);

      const response = await request.get(
        '/api/apps/1/actions/pages.0.blocks.0.actions.ssrfPrivate192?data={}',
      );

      expect(response.status).toBe(403);
      expect(response.data.message).toMatch(/private|blocked|not allowed/i);
    });

    it('should block requests to private IP 172.16.0.1', async () => {
      await Organization.create({ id: 'org' });
      await App.create({
        vapidPublicKey: '',
        vapidPrivateKey: '',
        OrganizationId: 'org',
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
                    ssrfPrivate172: {
                      type: 'request',
                      url: 'http://172.16.0.1:3000/api',
                    },
                  },
                },
              ],
            },
          ],
        },
      } as Partial<App>);

      const response = await request.get(
        '/api/apps/1/actions/pages.0.blocks.0.actions.ssrfPrivate172?data={}',
      );

      expect(response.status).toBe(403);
      expect(response.data.message).toMatch(/private|blocked|not allowed/i);
    });

    it('should block requests to cloud metadata endpoint (169.254.169.254)', async () => {
      await Organization.create({ id: 'org' });
      await App.create({
        vapidPublicKey: '',
        vapidPrivateKey: '',
        OrganizationId: 'org',
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
                    ssrfMetadata: {
                      type: 'request',
                      url: 'http://169.254.169.254/latest/meta-data/',
                    },
                  },
                },
              ],
            },
          ],
        },
      } as Partial<App>);

      const response = await request.get(
        '/api/apps/1/actions/pages.0.blocks.0.actions.ssrfMetadata?data={}',
      );

      expect(response.status).toBe(403);
      expect(response.data.message).toMatch(/private|blocked|not allowed/i);
    });
  });

  describe('Kubernetes Internal Services', () => {
    it('should block requests to *.svc.cluster.local (non-companion)', async () => {
      await Organization.create({ id: 'org' });
      await App.create({
        vapidPublicKey: '',
        vapidPrivateKey: '',
        OrganizationId: 'org',
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
                    ssrfK8sInternal: {
                      type: 'request',
                      url: 'http://some-service.some-namespace.svc.cluster.local:8080/api',
                    },
                  },
                },
              ],
            },
          ],
        },
      } as Partial<App>);

      const response = await request.get(
        '/api/apps/1/actions/pages.0.blocks.0.actions.ssrfK8sInternal?data={}',
      );

      expect(response.status).toBe(403);
      expect(response.data.message).toMatch(/private|not allowed|forbidden/i);
    });

    it('should block requests to kubernetes API', async () => {
      await Organization.create({ id: 'org' });
      await App.create({
        vapidPublicKey: '',
        vapidPrivateKey: '',
        OrganizationId: 'org',
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
                    ssrfK8sApi: {
                      type: 'request',
                      url: 'https://kubernetes.default.svc:443/api/v1/namespaces',
                    },
                  },
                },
              ],
            },
          ],
        },
      } as Partial<App>);

      const response = await request.get(
        '/api/apps/1/actions/pages.0.blocks.0.actions.ssrfK8sApi?data={}',
      );

      expect(response.status).toBe(403);
      expect(response.data.message).toMatch(/kubernetes|private|not allowed|forbidden/i);
    });
  });

  describe('IPv6 Bypass Attempts', () => {
    it('should block IPv4-mapped IPv6 addresses (::ffff:127.0.0.1)', async () => {
      await Organization.create({ id: 'org' });
      await App.create({
        vapidPublicKey: '',
        vapidPrivateKey: '',
        OrganizationId: 'org',
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
                    ssrfIPv6Mapped: {
                      type: 'request',
                      url: 'http://[::ffff:127.0.0.1]:8080/',
                    },
                  },
                },
              ],
            },
          ],
        },
      } as Partial<App>);

      const response = await request.get(
        '/api/apps/1/actions/pages.0.blocks.0.actions.ssrfIPv6Mapped?data={}',
      );

      expect(response.status).toBe(403);
      expect(response.data.message).toMatch(/private|blocked|not allowed/i);
    });

    it('should block IPv6 loopback (::1)', async () => {
      await Organization.create({ id: 'org' });
      await App.create({
        vapidPublicKey: '',
        vapidPrivateKey: '',
        OrganizationId: 'org',
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
                    ssrfIPv6Loopback: {
                      type: 'request',
                      url: 'http://[::1]:8080/',
                    },
                  },
                },
              ],
            },
          ],
        },
      } as Partial<App>);

      const response = await request.get(
        '/api/apps/1/actions/pages.0.blocks.0.actions.ssrfIPv6Loopback?data={}',
      );

      expect(response.status).toBe(403);
      expect(response.data.message).toMatch(/private|blocked|not allowed/i);
    });
  });

  describe('Legitimate Public URLs', () => {
    it('should allow requests to public URLs', async () => {
      await Organization.create({ id: 'org' });
      await App.create({
        vapidPublicKey: '',
        vapidPrivateKey: '',
        OrganizationId: 'org',
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
                    publicUrl: {
                      type: 'request',
                      url: 'https://httpbin.org/get',
                    },
                  },
                },
              ],
            },
          ],
        },
      } as Partial<App>);

      const response = await request.get(
        '/api/apps/1/actions/pages.0.blocks.0.actions.publicUrl?data={}',
      );

      // Should succeed (200) or at least not be blocked (not 403)
      expect(response.status).not.toBe(403);
    });
  });
});
