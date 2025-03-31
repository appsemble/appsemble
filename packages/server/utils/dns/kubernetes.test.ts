import { Agent } from 'node:https';

import { version } from '@appsemble/node-utils';
import axios, { type AxiosRequestConfig } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { fs, vol } from 'memfs';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { App, AppCollection, Organization } from '../../models/index.js';
import { setArgv } from '../argv.js';

let kubernetes: typeof import('./kubernetes.js');
const mock = new MockAdapter(axios);
const ca = `-----BEGIN CERTIFICATE-----
-----END CERTIFICATE-----`;

describe('kubernetes', () => {
  vi.mock('node:fs/promises', () => fs.promises);

  beforeAll(async () => {
    kubernetes = await import('./kubernetes.js');
  });

  beforeEach(() => {
    vol.fromJSON({
      '/var/run/secrets/kubernetes.io/serviceaccount/ca.crt': ca,
      '/var/run/secrets/kubernetes.io/serviceaccount/namespace': 'test',
      '/var/run/secrets/kubernetes.io/serviceaccount/token': 'kubenetes.serviceaccount.token',
    });
  });

  afterEach(() => {
    App.removeHook('afterSave', 'dns');
    Organization.removeHook('afterCreate', 'dns');
    AppCollection.removeHook('afterSave', 'dns');
  });

  describe('configureDNS', () => {
    it('should create a wildcard ingress when an organization is created', async () => {
      let config: AxiosRequestConfig | undefined;
      mock.onPost(/.*/).reply((request) => {
        config = request;
        return [201, request.data];
      });

      setArgv({ host: 'https://host.example', serviceName: 'review-service', servicePort: 'http' });
      await kubernetes.configureDNS();
      await Organization.create({ id: 'testorg' });

      expect(config?.url).toBe('/apis/networking.k8s.io/v1/namespaces/test/ingresses');
      expect(config?.baseURL).toBe('https://kubernetes.default.svc:443');
      expect({ ...config?.headers }).toStrictEqual({
        Accept: 'application/json, text/plain, */*',
        authorization: 'Bearer kubenetes.serviceaccount.token',
        'Content-Type': 'application/json',
      });
      expect(config?.httpsAgent).toBeInstanceOf(Agent);
      expect(config?.httpsAgent.options.ca).toBe(ca);
      expect(JSON.parse(config?.data)).toStrictEqual({
        metadata: {
          annotations: {},
          labels: {
            'app.kubernetes.io/component': 'domain',
            'app.kubernetes.io/instance': 'testorg-host-example',
            'app.kubernetes.io/managed-by': 'review-service',
            'app.kubernetes.io/name': 'appsemble',
            'app.kubernetes.io/part-of': 'review-service',
            'app.kubernetes.io/version': version,
          },
          name: 'testorg-host-example',
        },
        spec: {
          ingressClassName: 'nginx',
          rules: [
            {
              host: '*.testorg.host.example',
              http: {
                paths: [
                  {
                    backend: { service: { name: 'review-service', port: { name: 'http' } } },
                    path: '/',
                    pathType: 'Prefix',
                  },
                ],
              },
            },
          ],
          tls: [
            { hosts: ['*.testorg.host.example'], secretName: 'testorg-host-example-tls-wilcard' },
          ],
        },
      });
    });

    it('should create an ingress when an app with a domain is created', async () => {
      let config: AxiosRequestConfig | undefined;
      mock.onPost(/.*/).reply((request) => {
        config = request;
        return [201, request.data];
      });

      setArgv({ host: 'https://host.example', serviceName: 'review-service', servicePort: 'http' });
      await Organization.create({ id: 'org' });
      await kubernetes.configureDNS();
      await App.create({
        domain: 'example.com',
        definition: '',
        vapidPublicKey: '',
        vapidPrivateKey: '',
        OrganizationId: 'org',
      });

      expect(config?.url).toBe('/apis/networking.k8s.io/v1/namespaces/test/ingresses');
      expect(config?.baseURL).toBe('https://kubernetes.default.svc:443');
      expect({ ...config?.headers }).toStrictEqual({
        Accept: 'application/json, text/plain, */*',
        authorization: 'Bearer kubenetes.serviceaccount.token',
        'Content-Type': 'application/json',
      });
      expect(config?.httpsAgent).toBeInstanceOf(Agent);
      expect(config?.httpsAgent.options.ca).toBe(ca);
      expect(JSON.parse(config?.data)).toStrictEqual({
        metadata: {
          annotations: {},
          labels: {
            'app.kubernetes.io/component': 'domain',
            'app.kubernetes.io/instance': 'example-com',
            'app.kubernetes.io/managed-by': 'review-service',
            'app.kubernetes.io/name': 'appsemble',
            'app.kubernetes.io/part-of': 'review-service',
            'app.kubernetes.io/version': version,
          },
          name: 'example-com',
        },
        spec: {
          ingressClassName: 'nginx',
          rules: [
            {
              host: 'example.com',
              http: {
                paths: [
                  {
                    backend: { service: { name: 'review-service', port: { name: 'http' } } },
                    path: '/',
                    pathType: 'Prefix',
                  },
                ],
              },
            },
          ],
          tls: [{ hosts: ['example.com'], secretName: 'example-com-tls' }],
        },
      });
    });

    it('should not create an ingress when an app without a domain is created', async () => {
      let config: AxiosRequestConfig | undefined;
      mock.onPost(/.*/).reply((request) => {
        config = request;
        return [201, request.data];
      });

      setArgv({ host: 'https://host.example', serviceName: 'review-service', servicePort: 'http' });
      await Organization.create({ id: 'org' });
      await kubernetes.configureDNS();
      await App.create({
        definition: '',
        vapidPublicKey: '',
        vapidPrivateKey: '',
        OrganizationId: 'org',
      });

      expect(config).toBeUndefined();
    });

    it('should inject custom annotations', async () => {
      let config: AxiosRequestConfig | undefined;
      mock.onPost(/.*/).reply((request) => {
        config = request;
        return [201, request.data];
      });

      setArgv({
        host: 'https://host.example',
        ingressAnnotations: JSON.stringify({ custom: 'annotation' }),
        serviceName: 'review-service',
        servicePort: 'http',
      });
      await kubernetes.configureDNS();
      await Organization.create({ id: 'foo' });

      expect(config?.url).toBe('/apis/networking.k8s.io/v1/namespaces/test/ingresses');
      expect(config?.baseURL).toBe('https://kubernetes.default.svc:443');
      expect({ ...config?.headers }).toStrictEqual({
        Accept: 'application/json, text/plain, */*',
        authorization: 'Bearer kubenetes.serviceaccount.token',
        'Content-Type': 'application/json',
      });
      expect(config?.httpsAgent).toBeInstanceOf(Agent);
      expect(config?.httpsAgent.options.ca).toBe(ca);
      expect(JSON.parse(config?.data)).toStrictEqual({
        metadata: {
          annotations: { custom: 'annotation' },
          labels: {
            'app.kubernetes.io/component': 'domain',
            'app.kubernetes.io/instance': 'foo-host-example',
            'app.kubernetes.io/managed-by': 'review-service',
            'app.kubernetes.io/name': 'appsemble',
            'app.kubernetes.io/part-of': 'review-service',
            'app.kubernetes.io/version': version,
          },
          name: 'foo-host-example',
        },
        spec: {
          ingressClassName: 'nginx',
          rules: [
            {
              host: '*.foo.host.example',
              http: {
                paths: [
                  {
                    backend: { service: { name: 'review-service', port: { name: 'http' } } },
                    path: '/',
                    pathType: 'Prefix',
                  },
                ],
              },
            },
          ],
          tls: [{ hosts: ['*.foo.host.example'], secretName: 'foo-host-example-tls-wilcard' }],
        },
      });
    });

    it('should create an ingress and a www ingress when an app collection with a domain is created', async () => {
      const configs: AxiosRequestConfig[] = [];
      mock.onPost(/.*/).reply((request) => {
        configs.push(request);
        return [201, request.data];
      });

      setArgv({ host: 'https://host.example', serviceName: 'review-service', servicePort: 'http' });
      await Organization.create({ id: 'org' });
      await kubernetes.configureDNS();
      await AppCollection.create({
        name: 'Test Collection',
        expertName: 'Test Expert',
        expertDescription: 'Test Description',
        OrganizationId: 'org',
        headerImage: Buffer.from(''),
        headerImageMimeType: 'image/png',
        expertProfileImage: Buffer.from(''),
        expertProfileImageMimeType: 'image/png',
        domain: 'example.com',
        visibility: 'public',
      });

      expect(JSON.parse(configs[0].data)).toStrictEqual({
        metadata: {
          annotations: {},
          labels: expect.any(Object),
          name: 'example-com',
        },
        spec: expect.objectContaining({
          rules: [
            expect.objectContaining({
              host: 'example.com',
            }),
          ],
          tls: [
            expect.objectContaining({
              hosts: ['example.com'],
              secretName: 'example-com-tls',
            }),
          ],
        }),
      });
      expect(JSON.parse(configs[1].data)).toStrictEqual({
        metadata: {
          annotations: {
            'nginx.ingress.kubernetes.io/rewrite-target': 'https://example.com/$1',
            'nginx.ingress.kubernetes.io/use-regex': 'true',
          },
          labels: expect.any(Object),
          name: 'www-example-com',
        },
        spec: expect.objectContaining({
          rules: [
            expect.objectContaining({
              host: 'www.example.com',
            }),
          ],
          tls: [
            expect.objectContaining({
              hosts: ['www.example.com'],
              secretName: 'www-example-com-tls',
            }),
          ],
        }),
      });
    });

    it('should not create an ingress when an app collection without a domain is created', async () => {
      const configs: AxiosRequestConfig[] = [];
      mock.onPost(/.*/).reply((request) => {
        configs.push(request);
        return [201, request.data];
      });

      setArgv({ host: 'https://host.example', serviceName: 'review-service', servicePort: 'http' });
      await Organization.create({ id: 'org' });
      await kubernetes.configureDNS();
      await AppCollection.create({
        name: 'Test Collection',
        expertName: 'Test Expert',
        expertDescription: 'Test Description',
        OrganizationId: 'org',
        headerImage: Buffer.from(''),
        headerImageMimeType: 'image/png',
        expertProfileImage: Buffer.from(''),
        expertProfileImageMimeType: 'image/png',
        visibility: 'public',
      });

      expect(configs).toHaveLength(0);
    });

    it('should create only one www ingress when an app collection with a www domain is created', async () => {
      const configs: AxiosRequestConfig[] = [];
      mock.onPost(/.*/).reply((request) => {
        configs.push(request);
        return [201, request.data];
      });

      setArgv({ host: 'https://host.example', serviceName: 'review-service', servicePort: 'http' });
      await Organization.create({ id: 'org' });
      await kubernetes.configureDNS();
      await AppCollection.create({
        name: 'Test Collection',
        expertName: 'Test Expert',
        expertDescription: 'Test Description',
        OrganizationId: 'org',
        headerImage: Buffer.from(''),
        headerImageMimeType: 'image/png',
        expertProfileImage: Buffer.from(''),
        expertProfileImageMimeType: 'image/png',
        domain: 'www.example.com',
        visibility: 'public',
      });

      expect(JSON.parse(configs[0].data)).toStrictEqual({
        metadata: {
          annotations: {},
          labels: expect.any(Object),
          name: 'www-example-com',
        },
        spec: expect.objectContaining({
          rules: [
            expect.objectContaining({
              host: 'www.example.com',
            }),
          ],
          tls: [
            expect.objectContaining({
              hosts: ['www.example.com'],
              secretName: 'www-example-com-tls',
            }),
          ],
        }),
      });
      expect(configs).toHaveLength(1);
    });
  });

  describe('cleanupDNS', () => {
    it('should delete all ingresses managed by the service', async () => {
      const configs: AxiosRequestConfig[] = [];
      mock.onDelete(/.*/).reply((request) => {
        configs.push(request);
        return [204];
      });

      setArgv({
        host: 'https://host.example',
        serviceName: 'review-service',
        servicePort: 'http',
      });
      await kubernetes.cleanupDNS();

      expect(configs[1].url).toBe('/api/v1/namespaces/test/secrets');
      expect(configs[1].baseURL).toBe('https://kubernetes.default.svc:443');
      expect(configs[1].params).toStrictEqual({
        labelSelector: 'app.kubernetes.io/managed-by=review-service',
      });
      expect(configs[0].url).toBe('/apis/networking.k8s.io/v1/namespaces/test/ingresses');
      expect(configs[0].baseURL).toBe('https://kubernetes.default.svc:443');
      expect(configs[0].params).toStrictEqual({
        labelSelector: 'app.kubernetes.io/managed-by=review-service',
      });
    });
  });

  describe('restoreDNS', () => {
    it('should create ingresses for all apps and organizations in the database', async () => {
      const ingresses: unknown[] = [];
      mock.onPost(/.*/).reply((request) => {
        ingresses.push(JSON.parse(request.data));
        return [201, request.data];
      });
      await Organization.create({ id: 'test' });
      await App.create({
        definition: {},
        vapidPublicKey: '',
        vapidPrivateKey: '',
        OrganizationId: 'test',
      });
      await App.create({
        domain: 'app.example',
        definition: {},
        vapidPublicKey: '',
        vapidPrivateKey: '',
        OrganizationId: 'test',
      });
      await AppCollection.create({
        name: 'Test Collection',
        expertName: 'Test Expert',
        expertDescription: 'Test Description',
        expertProfileImage: Buffer.from(''),
        expertProfileImageMimeType: 'image/png',
        headerImage: Buffer.from(''),
        headerImageMimeType: 'image/png',
        visibility: 'public',
        OrganizationId: 'test',
        domain: 'example.com',
      });

      setArgv({
        host: 'https://host.example',
        serviceName: 'review-service',
        servicePort: 'http',
      });
      await kubernetes.restoreDNS();

      expect(ingresses).toStrictEqual([
        {
          metadata: {
            annotations: {},
            labels: {
              'app.kubernetes.io/component': 'domain',
              'app.kubernetes.io/instance': 'test-host-example',
              'app.kubernetes.io/managed-by': 'review-service',
              'app.kubernetes.io/name': 'appsemble',
              'app.kubernetes.io/part-of': 'review-service',
              'app.kubernetes.io/version': version,
            },
            name: 'test-host-example',
          },
          spec: {
            ingressClassName: 'nginx',
            rules: [
              {
                host: '*.test.host.example',
                http: {
                  paths: [
                    {
                      backend: { service: { name: 'review-service', port: { name: 'http' } } },
                      path: '/',
                      pathType: 'Prefix',
                    },
                  ],
                },
              },
            ],
            tls: [{ hosts: ['*.test.host.example'], secretName: 'test-host-example-tls-wilcard' }],
          },
        },
        {
          metadata: {
            annotations: {},
            labels: {
              'app.kubernetes.io/component': 'domain',
              'app.kubernetes.io/instance': 'app-example',
              'app.kubernetes.io/managed-by': 'review-service',
              'app.kubernetes.io/name': 'appsemble',
              'app.kubernetes.io/part-of': 'review-service',
              'app.kubernetes.io/version': version,
            },
            name: 'app-example',
          },
          spec: {
            ingressClassName: 'nginx',
            rules: [
              {
                host: 'app.example',
                http: {
                  paths: [
                    {
                      backend: { service: { name: 'review-service', port: { name: 'http' } } },
                      path: '/',
                      pathType: 'Prefix',
                    },
                  ],
                },
              },
            ],
            tls: [{ hosts: ['app.example'], secretName: 'app-example-tls' }],
          },
        },
        {
          metadata: {
            annotations: {},
            labels: {
              'app.kubernetes.io/component': 'domain',
              'app.kubernetes.io/instance': 'example-com',
              'app.kubernetes.io/managed-by': 'review-service',
              'app.kubernetes.io/name': 'appsemble',
              'app.kubernetes.io/part-of': 'review-service',
              'app.kubernetes.io/version': version,
            },
            name: 'example-com',
          },
          spec: {
            ingressClassName: 'nginx',
            rules: [
              {
                host: 'example.com',
                http: {
                  paths: [
                    {
                      backend: { service: { name: 'review-service', port: { name: 'http' } } },
                      path: '/',
                      pathType: 'Prefix',
                    },
                  ],
                },
              },
            ],
            tls: [{ hosts: ['example.com'], secretName: 'example-com-tls' }],
          },
        },
        {
          metadata: {
            annotations: {
              'nginx.ingress.kubernetes.io/rewrite-target': 'https://example.com/$1',
              'nginx.ingress.kubernetes.io/use-regex': 'true',
            },
            labels: {
              'app.kubernetes.io/component': 'domain',
              'app.kubernetes.io/instance': 'www-example-com',
              'app.kubernetes.io/managed-by': 'review-service',
              'app.kubernetes.io/name': 'appsemble',
              'app.kubernetes.io/part-of': 'review-service',
              'app.kubernetes.io/version': version,
            },
            name: 'www-example-com',
          },
          spec: {
            ingressClassName: 'nginx',
            rules: [
              {
                host: 'www.example.com',
                http: {
                  paths: [
                    {
                      backend: { service: { name: 'review-service', port: { name: 'http' } } },
                      path: '/',
                      pathType: 'Prefix',
                    },
                  ],
                },
              },
            ],
            tls: [{ hosts: ['www.example.com'], secretName: 'www-example-com-tls' }],
          },
        },
      ]);
    });
  });

  describe('getSSLStatus', () => {
    it('should return the status of the SSL certificates', async () => {
      setArgv({ host: 'https://host.example', serviceName: 'review-service', servicePort: 'http' });
      mock.onGet('/apis/cert-manager.io/v1/namespaces/test/certificates').reply(200, {
        items: [
          {
            spec: { dnsNames: ['app.example.com'] },
            status: { conditions: [{ type: 'Ready', status: 'True' }] },
          },
          {
            spec: { dnsNames: ['app2.example.com'] },
            status: {
              conditions: [
                { type: 'Ready', status: 'False' },
                { type: 'Issuing', status: 'True' },
              ],
            },
          },
          {
            spec: { dnsNames: ['app3.example.com'] },
            status: { conditions: [{ type: 'Ready', status: 'Unknown' }] },
          },
          {
            spec: { dnsNames: ['app4.example.com'] },
            status: { conditions: [{ type: 'Ready', status: 'False' }] },
          },
          {
            spec: { dnsNames: ['app5.example.com'] },
            status: { conditions: [{ type: 'Issuing', status: 'True' }] },
          },
          {
            spec: { dnsNames: ['app6.example.com'] },
            status: {
              conditions: [
                { type: 'Ready', status: 'False' },
                { type: 'Issuing', status: 'False' },
              ],
            },
          },
        ],
      });
      const result = await kubernetes.getSSLStatus([
        'app.example.com',
        'app2.example.com',
        'app3.example.com',
        'app4.example.com',
        'app5.example.com',
        'app6.example.com',
        'missing-app.example.com',
      ]);
      expect(result).toStrictEqual({
        'app.example.com': 'ready',
        'app2.example.com': 'pending',
        'app3.example.com': 'unknown',
        'app4.example.com': 'error',
        'app5.example.com': 'error',
        'app6.example.com': 'unknown',
        'missing-app.example.com': 'missing',
      });
    });

    /**
     * If forceProtocolHttps is enabled, we assume both the host and its subdomains have their SSL
     * managed outside of the kubernetes namespace. Therefore, we should return 'ready' for all
     * subdomains of the host.
     *
     * This is meant for instances where the SSL is managed by a third-party service like
     * Cloudflare, or the kubernetes cluster's ingress controller has a [default SSL
     * certificate](https://kubernetes.github.io/ingress-nginx/user-guide/tls/#default-ssl-certificate) set.
     */
    it('should have subdomains of host be ready if forceProtocolHttps is enabled', async () => {
      setArgv({
        host: 'https://example.com',
        serviceName: 'review-service',
        servicePort: 'http',
        forceProtocolHttps: true,
      });
      const certData = {
        items: [] as [],
      };
      mock.onGet('/apis/cert-manager.io/v1/namespaces/test/certificates').reply(200, certData);

      const result1 = await kubernetes.getSSLStatus([
        'example.com',
        'app.example.com',
        'app.example.org',
      ]);
      expect(result1).toStrictEqual({
        'example.com': 'ready',
        'app.example.com': 'ready',
        'app.example.org': 'missing',
      });
    });
  });
});
