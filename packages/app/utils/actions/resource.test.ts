import { AppDefinition } from '@appsemble/types';
import axios, { AxiosRequestConfig } from 'axios';
import MockAdapter from 'axios-mock-adapter';

import { createTestAction } from '../makeActions.js';
import { apiUrl } from '../settings.js';

const app: AppDefinition = {
  defaultPage: '',
  resources: {
    pet: { schema: { type: 'object' } },
  },
  pages: [],
};

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
    });
    const result = await action({ id: 1 });
    expect(request.method).toBe('get');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/resources/pet/1`);
    expect(request.params).toBeUndefined();
    expect(request.data).toBeUndefined();
    expect(result).toStrictEqual({ type: 'cat' });
  });

  it('should make a GET request with views', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [200, { type: 'dog' }, {}];
    });
    const action = createTestAction({
      app,
      definition: {
        type: 'resource.get',
        resource: 'pet',
        view: 'dogs',
        query: { static: { $filter: "type eq 'dog'" } },
      },
    });
    const result = await action({ id: 1 });
    expect(request.method).toBe('get');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/resources/pet/1`);
    expect(request.params).toStrictEqual({ $filter: "type eq 'dog'", view: 'dogs' });
    expect(request.data).toBeUndefined();
    expect(result).toStrictEqual({ type: 'dog' });
  });
});

describe('resource.query', () => {
  it('should make a GET request', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [200, [{ type: 'cat' }], {}];
    });
    const action = createTestAction({
      app,
      definition: { type: 'resource.query', resource: 'pet' },
    });
    const result = await action();
    expect(request.method).toBe('get');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/resources/pet`);
    expect(request.params).toBeUndefined();
    expect(request.data).toBeUndefined();
    expect(result).toStrictEqual([{ type: 'cat' }]);
  });

  it('should make a GET request with views', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [200, { type: 'dog' }, {}];
    });
    const action = createTestAction({
      app,
      definition: {
        type: 'resource.query',
        resource: 'pet',
        view: 'dogs',
        query: { static: { $filter: "type eq 'dog'" } },
      },
    });
    const result = await action({ id: 1 });
    expect(request.method).toBe('get');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/resources/pet`);
    expect(request.params).toStrictEqual({ $filter: "type eq 'dog'", view: 'dogs' });
    expect(request.data).toBeUndefined();
    expect(result).toStrictEqual({ type: 'dog' });
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
    });
    const result = await action({ type: 'fish' });
    expect(request.method).toBe('post');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/resources/pet`);
    expect(request.params).toBeUndefined();
    expect(request.data).toBe('{"type":"fish"}');
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
    });
    const result = await action({ id: 84, type: 'fish' });
    expect(request.method).toBe('put');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/resources/pet/84`);
    expect(request.params).toBeUndefined();
    expect(request.data).toBe('{"id":84,"type":"fish"}');
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
    });
    const result = await action({ id: 63 });
    expect(request.method).toBe('delete');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/resources/pet/63`);
    expect(request.params).toBeUndefined();
    expect(request.data).toBeUndefined();
    expect(result).toBeNull();
  });
});
