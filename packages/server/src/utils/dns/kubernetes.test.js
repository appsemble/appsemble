import { logger } from '@appsemble/node-utils';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import fs from 'fs-extra';

import kubernetes from './kubernetes';

let backend;
jest.mock('fs');

beforeEach(() => {
  backend = new MockAdapter(axios);
  backend.onGet('https://kubernetes.default.svc:443/openapi/v2').reply(200, {
    info: {
      title: 'Kubernetes',
      version: 'test',
    },
  });
  jest.spyOn(fs, 'readFile').mockImplementation(async filename => {
    switch (filename) {
      case '/var/run/secrets/kubernetes.io/serviceaccount/ca.crt':
        return '-----BEGIN CERTIFICATE-----\nFake/Kubernetes/SSL/certificate==\n-----END CERTIFICATE-----';
      case '/var/run/secrets/kubernetes.io/serviceaccount/namespace':
        return 'appsemble';
      case '/var/run/secrets/kubernetes.io/serviceaccount/token':
        return 'kubernetes.access.token';
      default:
        throw new Error('File not found');
    }
  });
});

it('should log the Kubernetes API version', async () => {
  jest.spyOn(logger, 'info');
  await kubernetes({});
  expect(logger.info).toHaveBeenCalledWith('Using Kubernetes API version: Kubernetes test');
});

describe('add', () => {
  it('should add a new rule and tls config', async () => {
    backend
      .onPatch(
        'https://kubernetes.default.svc:443/apis/networking.k8s.io/v1beta1/namespaces/appsemble/ingresses/ingress-name',
      )
      .reply(200);
    const { add } = await kubernetes({
      ingressName: 'ingress-name',
      ingressServiceName: 'test-ingress',
      ingressServicePort: 'port',
    });
    await add('test.example.com');
    expect(backend.history.patch).toHaveLength(1);
    expect(backend.history.patch[0].headers).toMatchObject({
      Authorization: 'Bearer kubernetes.access.token',
      'Content-Type': 'application/json-patch+json',
    });
    expect(JSON.parse(backend.history.patch[0].data)).toStrictEqual([
      {
        op: 'add',
        path: '/spec/rules/-',
        value: {
          host: 'test.example.com',
          http: {
            paths: [{ path: '/', backend: { serviceName: 'test-ingress', servicePort: 'port' } }],
          },
        },
      },
      {
        op: 'add',
        path: '/spec/tls/-',
        value: { hosts: ['test.example.com'], secretName: 'test-example-com-tls' },
      },
    ]);
  });
});

describe('remove', () => {
  it('should change the url rule with a rule for the host variable', async () => {
    backend
      .onGet(
        'https://kubernetes.default.svc:443/apis/networking.k8s.io/v1beta1/namespaces/appsemble/ingresses/foo',
      )
      .reply(200, {
        spec: {
          rules: [{ host: 'appsemble.app' }, { host: 'example.com' }],
          tls: [{ hosts: ['appsemble.app'] }],
        },
      });
    backend
      .onPatch(
        'https://kubernetes.default.svc:443/apis/networking.k8s.io/v1beta1/namespaces/appsemble/ingresses/foo',
      )
      .reply(200);
    const { remove } = await kubernetes({
      host: 'appsemble.app',
      ingressName: 'foo',
      ingressServiceName: 'test-ingress',
      ingressServicePort: 'port',
    });
    await remove('example.com');
    expect(backend.history.patch).toHaveLength(1);
    expect(backend.history.patch[0].headers).toMatchObject({
      Authorization: 'Bearer kubernetes.access.token',
      'Content-Type': 'application/json-patch+json',
    });
    expect(JSON.parse(backend.history.patch[0].data)).toStrictEqual([
      {
        op: 'replace',
        path: '/spec/rules/1',
        value: {
          host: 'appsemble.app',
          http: {
            paths: [{ path: '/', backend: { serviceName: 'test-ingress', servicePort: 'port' } }],
          },
        },
      },
    ]);
  });
});

describe('update', () => {
  it('should replace the old url rule with a new url rule', async () => {
    backend
      .onGet(
        'https://kubernetes.default.svc:443/apis/networking.k8s.io/v1beta1/namespaces/appsemble/ingresses/foo',
      )
      .reply(200, {
        spec: {
          rules: [{ host: 'old.example.com' }],
          tls: [{ hosts: ['old.example.com'] }],
        },
      });
    backend
      .onPatch(
        'https://kubernetes.default.svc:443/apis/networking.k8s.io/v1beta1/namespaces/appsemble/ingresses/foo',
      )
      .reply(200);
    const { update } = await kubernetes({
      ingressName: 'foo',
      ingressServiceName: 'test-ingress',
      ingressServicePort: 'port',
    });
    await update('old.example.com', 'new.example.com');
    expect(backend.history.patch).toHaveLength(1);
    expect(backend.history.patch[0].headers).toMatchObject({
      Authorization: 'Bearer kubernetes.access.token',
      'Content-Type': 'application/json-patch+json',
    });
    expect(JSON.parse(backend.history.patch[0].data)).toStrictEqual([
      {
        op: 'replace',
        path: '/spec/rules/0',
        value: {
          host: 'new.example.com',
          http: {
            paths: [{ path: '/', backend: { serviceName: 'test-ingress', servicePort: 'port' } }],
          },
        },
      },
      {
        op: 'add',
        path: '/spec/tls/-',
        value: { hosts: ['new.example.com'], secretName: 'new-example-com-tls' },
      },
    ]);
  });

  it('should add the new url rule if the old one is unknown', async () => {
    backend
      .onGet(
        'https://kubernetes.default.svc:443/apis/networking.k8s.io/v1beta1/namespaces/appsemble/ingresses/foo',
      )
      .reply(200, {
        spec: {
          rules: [],
          tls: [],
        },
      });
    backend
      .onPatch(
        'https://kubernetes.default.svc:443/apis/networking.k8s.io/v1beta1/namespaces/appsemble/ingresses/foo',
      )
      .reply(200);
    const { update } = await kubernetes({
      ingressName: 'foo',
      ingressServiceName: 'test-ingress',
      ingressServicePort: 'port',
    });
    await update('old.example.com', 'new.example.com');
    expect(backend.history.patch).toHaveLength(1);
    expect(backend.history.patch[0].headers).toMatchObject({
      Authorization: 'Bearer kubernetes.access.token',
      'Content-Type': 'application/json-patch+json',
    });
    expect(JSON.parse(backend.history.patch[0].data)).toStrictEqual([
      {
        op: 'add',
        path: '/spec/rules/-',
        value: {
          host: 'new.example.com',
          http: {
            paths: [{ path: '/', backend: { serviceName: 'test-ingress', servicePort: 'port' } }],
          },
        },
      },
      {
        op: 'add',
        path: '/spec/tls/-',
        value: { hosts: ['new.example.com'], secretName: 'new-example-com-tls' },
      },
    ]);
  });

  it('should not add the same TLS rule twice', async () => {
    backend
      .onGet(
        'https://kubernetes.default.svc:443/apis/networking.k8s.io/v1beta1/namespaces/appsemble/ingresses/foo',
      )
      .reply(200, {
        spec: {
          rules: [],
          tls: [{ hosts: ['new.example.com'] }],
        },
      });
    backend
      .onPatch(
        'https://kubernetes.default.svc:443/apis/networking.k8s.io/v1beta1/namespaces/appsemble/ingresses/foo',
      )
      .reply(200);
    const { update } = await kubernetes({
      ingressName: 'foo',
      ingressServiceName: 'test-ingress',
      ingressServicePort: 'port',
    });
    await update('old.example.com', 'new.example.com');
    expect(backend.history.patch).toHaveLength(1);
    expect(backend.history.patch[0].headers).toMatchObject({
      Authorization: 'Bearer kubernetes.access.token',
      'Content-Type': 'application/json-patch+json',
    });
    expect(JSON.parse(backend.history.patch[0].data)).toStrictEqual([
      {
        op: 'add',
        path: '/spec/rules/-',
        value: {
          host: 'new.example.com',
          http: {
            paths: [{ path: '/', backend: { serviceName: 'test-ingress', servicePort: 'port' } }],
          },
        },
      },
    ]);
  });
});
