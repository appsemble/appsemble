import { Agent } from 'node:https';

import { version } from '@appsemble/node-utils';
import axios, { type AxiosRequestConfig } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { fs, vol } from 'memfs';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { App, Organization } from '../../models/index.js';
import { setArgv } from '../argv.js';
import { useTestDatabase } from '../test/testSchema.js';

let kubernetes: typeof import('./kubernetes.js');
const mock = new MockAdapter(axios);
const ca = `-----BEGIN CERTIFICATE-----
-----END CERTIFICATE-----`;

vi.mock('node:fs/promises', () => fs.promises);

useTestDatabase(import.meta);

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
});

describe('configureDNS', () => {
  it('should create a wildcard ingress when an organization is created', async () => {
    let config: AxiosRequestConfig;
    mock.onPost(/.*/).reply((request) => {
      config = request;
      return [201, request.data];
    });

    setArgv({ host: 'https://host.example', serviceName: 'review-service', servicePort: 'http' });
    await kubernetes.configureDNS();
    await Organization.create({ id: 'testorg' });

    expect(config.url).toBe('/apis/networking.k8s.io/v1/namespaces/test/ingresses');
    expect(config.baseURL).toBe('https://kubernetes.default.svc:443');
    expect({ ...config.headers }).toStrictEqual({
      Accept: 'application/json, text/plain, */*',
      authorization: 'Bearer kubenetes.serviceaccount.token',
      'Content-Type': 'application/json',
    });
    expect(config.httpsAgent).toBeInstanceOf(Agent);
    expect(config.httpsAgent.options.ca).toBe(ca);
    expect(JSON.parse(config.data)).toStrictEqual({
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

  it('should create a wildcard ingress when an app with a domain is created', async () => {
    let config: AxiosRequestConfig;
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

    expect(config.url).toBe('/apis/networking.k8s.io/v1/namespaces/test/ingresses');
    expect(config.baseURL).toBe('https://kubernetes.default.svc:443');
    expect({ ...config.headers }).toStrictEqual({
      Accept: 'application/json, text/plain, */*',
      authorization: 'Bearer kubenetes.serviceaccount.token',
      'Content-Type': 'application/json',
    });
    expect(config.httpsAgent).toBeInstanceOf(Agent);
    expect(config.httpsAgent.options.ca).toBe(ca);
    expect(JSON.parse(config.data)).toStrictEqual({
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

  it('should not create a wildcard ingress when an app without a domain is created', async () => {
    let config: AxiosRequestConfig;
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
    let config: AxiosRequestConfig;
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

    expect(config.url).toBe('/apis/networking.k8s.io/v1/namespaces/test/ingresses');
    expect(config.baseURL).toBe('https://kubernetes.default.svc:443');
    expect({ ...config.headers }).toStrictEqual({
      Accept: 'application/json, text/plain, */*',
      authorization: 'Bearer kubenetes.serviceaccount.token',
      'Content-Type': 'application/json',
    });
    expect(config.httpsAgent).toBeInstanceOf(Agent);
    expect(config.httpsAgent.options.ca).toBe(ca);
    expect(JSON.parse(config.data)).toStrictEqual({
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
    ]);
  });
});
