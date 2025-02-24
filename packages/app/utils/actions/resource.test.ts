import { type AppDefinition } from '@appsemble/types';
import axios, { type AxiosRequestConfig } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createTestAction } from '../makeActions.js';
import { apiUrl } from '../settings.js';

const appDefinition: AppDefinition = {
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
      appDefinition,
      definition: { type: 'resource.get', resource: 'pet' },
    });
    const result = await action({ id: 1 });
    expect(request.method).toBe('get');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/resources/pet/1`);
    expect(request.params).toBeUndefined();
    expect(request.data).toBeUndefined();
    expect(result).toStrictEqual({ type: 'cat' });
  });

  it('should support explicit id param', async () => {
    mock.onGet(/.*/).reply((req) => {
      request = req;
      return [200, { type: 'crow' }, {}];
    });
    const action = createTestAction({
      appDefinition,
      definition: { type: 'resource.get', resource: 'pet', id: { prop: 'test' } },
    });
    const result = await action({ test: 33 });
    expect(request.method).toBe('get');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/resources/pet/33`);
    expect(request.params).toBeUndefined();
    expect(request.data).toBeUndefined();
    expect(result).toStrictEqual({ type: 'crow' });
  });

  it('should make a GET request with views', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [200, { type: 'dog' }, {}];
    });
    const action = createTestAction({
      appDefinition,
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

describe('resource.update.positions', () => {
  it('should make a PUT request to the right URL', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [200, { id: 84, position: (44.55 + 45.66) / 2 }, {}];
    });
    const action = createTestAction({
      appDefinition,
      definition: { type: 'resource.update.positions', resource: 'pet' },
    });
    const result = await action({
      id: 84,
      type: 'fish',
      prevResourcePosition: 44.55,
      nextResourcePosition: 45.66,
    });
    expect(request.method).toBe('put');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/resources/pet/84/positions`);
    expect(request.params).toBeUndefined();
    expect(request.data).toBe('{"prevResourcePosition":44.55,"nextResourcePosition":45.66}');
    expect(result).toStrictEqual({ id: 84, position: (44.55 + 45.66) / 2 });
  });
});

describe('resource.query', () => {
  it('should make a GET request', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [200, [{ type: 'cat' }], {}];
    });
    const action = createTestAction({
      appDefinition,
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
      appDefinition,
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

  it('should make a GET request with $own', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [200, { type: 'dog' }, {}];
    });
    const action = createTestAction({
      appDefinition,
      definition: {
        type: 'resource.query',
        resource: 'pet',
        own: true,
        query: { static: { $filter: "type eq 'dog'" } },
      },
    });
    const result = await action({ id: 1 });
    expect(request.method).toBe('get');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/resources/pet`);
    expect(request.params).toStrictEqual({ $filter: "type eq 'dog'", $own: true });
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
      appDefinition,
      definition: { type: 'resource.count', resource: 'pet' },
    });
    const result = await action();
    expect(request.method).toBe('get');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/resources/pet/$count`);
    expect(request.params).toBeUndefined();
    expect(request.data).toBeUndefined();
    expect(result).toBe(12);
  });

  it('should make a GET request with $own', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [200, 12, {}];
    });
    const action = createTestAction({
      appDefinition,
      definition: { type: 'resource.count', resource: 'pet', own: true },
    });
    const result = await action();
    expect(request.method).toBe('get');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/resources/pet/$count`);
    expect(request.params).toStrictEqual({ $own: true });
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
      appDefinition,
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
      appDefinition,
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

describe('resource.patch', () => {
  it('should make a PATCH request', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [200, { ...JSON.parse(req.data), id: 84 }, {}];
    });
    const action = createTestAction({
      appDefinition,
      definition: { type: 'resource.patch', resource: 'pet' },
    });
    const result = await action({ id: 84, type: 'fish' });
    expect(request.method).toBe('patch');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/resources/pet/84`);
    expect(request.params).toBeUndefined();
    expect(request.data).toBe('{"id":84,"type":"fish"}');
    expect(result).toStrictEqual({ id: 84, type: 'fish' });
  });

  it('should allow resource id to be explicit', async () => {
    mock.onPatch(/.*/).reply((req) => {
      request = req;
      return [200, { ...JSON.parse(req.data), id: 84 }, {}];
    });
    const action = createTestAction({
      appDefinition,
      definition: { type: 'resource.patch', resource: 'pet', id: 84 },
    });
    const result = await action({ type: 'fish' });
    expect(request.method).toBe('patch');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/resources/pet/84`);
    expect(request.data).toBe('{"type":"fish"}');
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
      appDefinition,
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

describe('resource.delete.all', () => {
  it('should make a DELETE request for all resources', async () => {
    mock.onGet(/.*/).reply(() => [
      200,
      [
        { id: 1, type: 'pet' },
        { id: 2, type: 'pet' },
      ],
      {},
    ]);
    mock.onDelete(/.*/).reply((req) => {
      request = req;
      return [204, null, {}];
    });
    const action = createTestAction({
      appDefinition,
      definition: { type: 'resource.delete.all', resource: 'pet' },
    });
    const result = await action();
    expect(request.method).toBe('delete');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/resources/pet`);
    expect(request.params).toBeUndefined();
    expect(request.data).toBe('[1,2]');
    expect(result).toBeNull();
  });
});

describe('resource.delete.bulk', () => {
  it('should make a DELETE request for several resources', async () => {
    mock.onDelete(/.*/).reply((req) => {
      request = req;
      return [204, null, {}];
    });
    const action = createTestAction({
      appDefinition,
      definition: { type: 'resource.delete.bulk', resource: 'pet', body: { 'array.from': [63] } },
    });
    const result = await action([63]);
    expect(request.method).toBe('delete');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/resources/pet`);
    expect(request.params).toBeUndefined();
    expect(request.data).toBe('[63]');
    expect(result).toBeNull();
  });
});
