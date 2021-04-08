import { AppDefinition, Remapper } from '@appsemble/types';
import { remap } from '@appsemble/utils';
import axios, { AxiosRequestConfig } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { IntlMessageFormat } from 'intl-messageformat';

import { createTestAction } from '../makeActions';
import { apiUrl, appId } from '../settings';

const app: AppDefinition = {
  defaultPage: '',
  resources: {
    pet: {},
  },
  pages: [],
};

function remapWithContext(remapper: Remapper, data: any): any {
  return remap(remapper, data, {
    getMessage: ({ defaultMessage }) => new IntlMessageFormat(defaultMessage),
    appId,
    userInfo: null,
    context: {},
  });
}

let mock: MockAdapter;
let request: AxiosRequestConfig;

beforeEach(() => {
  mock = new MockAdapter(axios);
});

afterEach(() => {
  mock.restore();
});

describe('resource.get', () => {
  it('should make a GET request', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [200, { type: 'cat' }, {}];
    });
    const action = createTestAction({
      app,
      definition: { type: 'resource.get', resource: 'pet' },
      remap: remapWithContext,
    });
    const result = await action({ id: 1 });
    expect(request.method).toBe('get');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/resources/pet/1`);
    expect(request.params).toBeUndefined();
    expect(request.data).toBeUndefined();
    expect(result).toStrictEqual({ type: 'cat' });
  });
});

describe('resource.query', () => {
  it('should make a GET request', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [200, [{ type: 'dog' }], {}];
    });
    const action = createTestAction({
      app,
      definition: { type: 'resource.query', resource: 'pet' },
      remap: remapWithContext,
    });
    const result = await action();
    expect(request.method).toBe('get');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/resources/pet`);
    expect(request.params).toBeUndefined();
    expect(request.data).toBeUndefined();
    expect(result).toStrictEqual([{ type: 'dog' }]);
  });
});

describe('resource.count', () => {
  it('should make a GET request', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [200, 12, {}];
    });
    const action = createTestAction({
      app,
      definition: { type: 'resource.count', resource: 'pet' },
      remap: remapWithContext,
    });
    const result = await action();
    expect(request.method).toBe('get');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/resources/pet/$count`);
    expect(request.params).toBeUndefined();
    expect(request.data).toBeUndefined();
    expect(result).toBe(12);
  });
});

describe('resource.create', () => {
  it('should make a POST request', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [200, { ...JSON.parse(req.data), id: 84 }, {}];
    });
    const action = createTestAction({
      app,
      definition: { type: 'resource.create', resource: 'pet' },
      remap: remapWithContext,
    });
    const result = await action({ type: 'fish' });
    expect(request.method).toBe('post');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/resources/pet`);
    expect(request.params).toBeUndefined();
    expect(request.data).toStrictEqual('{"type":"fish"}');
    expect(result).toStrictEqual({ id: 84, type: 'fish' });
  });
});

describe('resource.update', () => {
  it('should make a PUT request', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [200, { ...JSON.parse(req.data), id: 84 }, {}];
    });
    const action = createTestAction({
      app,
      definition: { type: 'resource.update', resource: 'pet' },
      remap: remapWithContext,
    });
    const result = await action({ id: 84, type: 'fish' });
    expect(request.method).toBe('put');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/resources/pet/84`);
    expect(request.params).toBeUndefined();
    expect(request.data).toStrictEqual('{"id":84,"type":"fish"}');
    expect(result).toStrictEqual({ id: 84, type: 'fish' });
  });
});

describe('resource.delete', () => {
  it('should make a DELETE request', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [204, null, {}];
    });
    const action = createTestAction({
      app,
      definition: { type: 'resource.delete', resource: 'pet' },
      remap: remapWithContext,
    });
    const result = await action({ id: 63 });
    expect(request.method).toBe('delete');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/resources/pet/63`);
    expect(request.params).toBeUndefined();
    expect(request.data).toBeUndefined();
    expect(result).toBeNull();
  });
});
