import { Agent } from 'https';

import axios, { AxiosRequestConfig } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { vol } from 'memfs';

import { App, Organization } from '../../models';
import { setArgv } from '../argv';
import { useTestDatabase } from '../test/testSchema';
import { cleanupDNS, configureDNS, restoreDNS } from './kubernetes';

const mock = new MockAdapter(axios);
const ca = `-----BEGIN CERTIFICATE-----
-----END CERTIFICATE-----`;

jest.mock('fs');

useTestDatabase('kubernetes');

beforeEach(() => {
  vol.fromJSON({
    '/var/run/secrets/kubernetes.io/serviceaccount/ca.crt': ca,
    '/var/run/secrets/kubernetes.io/serviceaccount/namespace': 'test',
    '/var/run/secrets/kubernetes.io/serviceaccount/token': 'kubenetes.serviceaccount.token',
    [require.resolve('../../package.json')]: JSON.stringify({ version: '1.2.3' }),
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
    await configureDNS();
    await Organization.create({ id: 'testorg' });

    expect(config.url).toBe('/apis/networking.k8s.io/v1/namespaces/test/ingresses');
    expect(config.baseURL).toBe('https://kubernetes.default.svc:443');
    expect(config.headers).toStrictEqual({
      Accept: 'application/json, text/plain, */*',
      authorization: 'Bearer kubenetes.serviceaccount.token',
      'Content-Type': 'application/json',
    });
    expect(config.httpsAgent).toBeInstanceOf(Agent);
    expect(config.httpsAgent.options.ca).toBe(ca);
    expect(JSON.parse(config.data)).toStrictEqual({
      metadata: {
        labels: {
          'app.kubernetes.io/component': 'domain',
          'app.kubernetes.io/instance': 'testorg-host-example',
          'app.kubernetes.io/managed-by': 'review-service',
          'app.kubernetes.io/name': 'appsemble',
          'app.kubernetes.io/part-of': 'review-service',
          'app.kubernetes.io/version': '1.2.3',
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
    await configureDNS();
    await App.create({
      domain: 'example.com',
      definition: '',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      OrganizationId: 'org',
    });

    expect(config.url).toBe('/apis/networking.k8s.io/v1/namespaces/test/ingresses');
    expect(config.baseURL).toBe('https://kubernetes.default.svc:443');
    expect(config.headers).toStrictEqual({
      Accept: 'application/json, text/plain, */*',
      authorization: 'Bearer kubenetes.serviceaccount.token',
      'Content-Type': 'application/json',
    });
    expect(config.httpsAgent).toBeInstanceOf(Agent);
    expect(config.httpsAgent.options.ca).toBe(ca);
    expect(JSON.parse(config.data)).toStrictEqual({
      metadata: {
        labels: {
          'app.kubernetes.io/component': 'domain',
          'app.kubernetes.io/instance': 'example-com',
          'app.kubernetes.io/managed-by': 'review-service',
          'app.kubernetes.io/name': 'appsemble',
          'app.kubernetes.io/part-of': 'review-service',
          'app.kubernetes.io/version': '1.2.3',
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
    await configureDNS();
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
    await configureDNS();
    await Organization.create({ id: 'foo' });

    expect(config.url).toBe('/apis/networking.k8s.io/v1/namespaces/test/ingresses');
    expect(config.baseURL).toBe('https://kubernetes.default.svc:443');
    expect(config.headers).toStrictEqual({
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
          'app.kubernetes.io/version': '1.2.3',
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
    let config: AxiosRequestConfig;
    mock.onDelete(/.*/).reply((request) => {
      config = request;
      return [204];
    });

    setArgv({
      host: 'https://host.example',
      serviceName: 'review-service',
      servicePort: 'http',
    });
    await cleanupDNS();

    expect(config.url).toBe('/apis/networking.k8s.io/v1/namespaces/test/ingresses');
    expect(config.baseURL).toBe('https://kubernetes.default.svc:443');
    expect(config.params).toStrictEqual({
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
    await restoreDNS();

    expect(ingresses).toStrictEqual([
      {
        metadata: {
          labels: {
            'app.kubernetes.io/component': 'domain',
            'app.kubernetes.io/instance': 'test-host-example',
            'app.kubernetes.io/managed-by': 'review-service',
            'app.kubernetes.io/name': 'appsemble',
            'app.kubernetes.io/part-of': 'review-service',
            'app.kubernetes.io/version': '1.2.3',
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
          labels: {
            'app.kubernetes.io/component': 'domain',
            'app.kubernetes.io/instance': 'app-example',
            'app.kubernetes.io/managed-by': 'review-service',
            'app.kubernetes.io/name': 'appsemble',
            'app.kubernetes.io/part-of': 'review-service',
            'app.kubernetes.io/version': '1.2.3',
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
