// With jsdom, classes such as ArrayBuffer and Blob behave the same between tests and the tested code,
// but are not referentially equal, meaning `instanceof` checks in the tested code and in the tests will fail. happy-dom does not have this issue
// @vitest-environment happy-dom
import axios, { type AxiosRequestConfig } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createTestAction } from '../makeActions.js';
import { apiUrl } from '../settings.js';

let mock: MockAdapter;
let request: AxiosRequestConfig;

beforeEach(() => {
  mock = new MockAdapter(axios);
});

afterEach(() => {
  mock.restore();
});

describe('request', () => {
  it('should expose the HTTP method', () => {
    const action = createTestAction({
      definition: { type: 'request' },
    });
    expect(action.method).toBe('GET');
  });

  it('should expose the URL', () => {
    const action = createTestAction({
      definition: { type: 'request', url: 'https://example.com' },
    });
    expect(action.url).toBe('https://example.com');
  });

  it('should default to GET', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [200, { hello: 'data' }, {}];
    });
    const action = createTestAction({
      definition: { type: 'request' },
      prefix: 'pages.test.blocks.0.actions.onClick',
      prefixIndex: 'pages.0.blocks.0.actions.onClick',
    });
    const result = await action({ hello: 'get' });
    expect(request.method).toBe('get');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/actions/pages.0.blocks.0.actions.onClick`);
    expect(request.params).toStrictEqual({ data: '{"hello":"get"}' });
    expect(request.data).toBeUndefined();
    expect(result).toStrictEqual({ hello: 'data' });
  });

  it('should support DELETE', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [200, { hello: 'data' }, {}];
    });
    const action = createTestAction({
      definition: { type: 'request', method: 'delete' },
      prefix: 'pages.test.blocks.0.actions.onClick',
      prefixIndex: 'pages.0.blocks.0.actions.onClick',
    });
    const result = await action({ hello: 'delete' });
    expect(request.method).toBe('delete');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/actions/pages.0.blocks.0.actions.onClick`);
    expect(request.params).toStrictEqual({ data: '{"hello":"delete"}' });
    expect(request.data).toBeUndefined();
    expect(result).toStrictEqual({ hello: 'data' });
  });

  it('should support GET', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [200, { hello: 'data' }, {}];
    });
    const action = createTestAction({
      definition: { type: 'request', method: 'get' },
      prefix: 'pages.0.blocks.0.actions.onClick',
      prefixIndex: 'pages.0.blocks.0.actions.onClick',
    });
    const result = await action({ hello: 'get' });
    expect(request.method).toBe('get');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/actions/pages.0.blocks.0.actions.onClick`);
    expect(request.params).toStrictEqual({ data: '{"hello":"get"}' });
    expect(request.data).toBeUndefined();
    expect(result).toStrictEqual({ hello: 'data' });
  });

  it('should support PATCH', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [200, { hello: 'data' }, {}];
    });
    const action = createTestAction({
      definition: { type: 'request', method: 'patch' },
      prefix: 'pages.test.blocks.0.actions.onClick',
      prefixIndex: 'pages.0.blocks.0.actions.onClick',
    });
    const result = await action({ hello: 'patch' });
    expect(request.method).toBe('patch');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/actions/pages.0.blocks.0.actions.onClick`);
    expect(request.params).toBeUndefined();
    expect(request.data).toBe('{"hello":"patch"}');
    expect(result).toStrictEqual({ hello: 'data' });
  });

  it('should support POST', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [200, { hello: 'data' }, {}];
    });
    const action = createTestAction({
      definition: { type: 'request', method: 'post' },
      prefix: 'pages.test.blocks.0.actions.onClick',
      prefixIndex: 'pages.0.blocks.0.actions.onClick',
    });
    const result = await action({ hello: 'post' });
    expect(request.method).toBe('post');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/actions/pages.0.blocks.0.actions.onClick`);
    expect(request.params).toBeUndefined();
    expect(request.data).toBe('{"hello":"post"}');
    expect(result).toStrictEqual({ hello: 'data' });
  });

  it('should support content-type header', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [200, { hello: 'data' }, {}];
    });
    const action = createTestAction({
      definition: { type: 'request', method: 'post', headers: { 'Content-Type': 'text/plain' } },
      prefix: 'pages.test.blocks.0.actions.onClick',
      prefixIndex: 'pages.0.blocks.0.actions.onClick',
    });
    const result = await action({ hello: 'post' });
    expect(request.method).toBe('post');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/actions/pages.0.blocks.0.actions.onClick`);
    expect(request.params).toBeUndefined();
    expect(request.data).toBe('{"hello":"post"}');
    expect(result).toStrictEqual({ hello: 'data' });
    expect({ ...request.headers }).toMatchObject({
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'text/plain',
    });
  });

  it('should inherit content-type when the request data is a single binary blob', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [200, { hello: 'data' }, {}];
    });

    const imageData = new Blob([], { type: 'image/jpeg' });
    const action = createTestAction({
      definition: {
        type: 'request',
        method: 'post',
        body: { static: imageData },
      },
      prefix: 'pages.test.blocks.0.actions.onClick',
      prefixIndex: 'pages.0.blocks.0.actions.onClick',
    });

    await action(imageData);

    expect(request.method).toBe('post');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/actions/pages.0.blocks.0.actions.onClick`);
    expect(request.params).toBeUndefined();
    expect({ ...request.headers }).toMatchObject({
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'image/jpeg',
    });
  });

  it('should ignore the content type from action definition when the request data is a single binary blob', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [200, { hello: 'data' }, {}];
    });

    const imageData = new Blob([], { type: 'image/jpeg' });
    const action = createTestAction({
      definition: {
        type: 'request',
        method: 'post',
        body: { static: imageData },
        headers: {
          'Content-Type': 'text/plain',
        },
      },
      prefix: 'pages.test.blocks.0.actions.onClick',
      prefixIndex: 'pages.0.blocks.0.actions.onClick',
    });

    await action(imageData);

    expect(request.method).toBe('post');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/actions/pages.0.blocks.0.actions.onClick`);
    expect(request.params).toBeUndefined();
    expect({ ...request.headers }).toMatchObject({
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'image/jpeg',
    });
  });

  it('should support PUT', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [200, { hello: 'data' }, {}];
    });
    const action = createTestAction({
      definition: { type: 'request', method: 'put' },
      prefix: 'pages.test.blocks.0.actions.onClick',
      prefixIndex: 'pages.0.blocks.0.actions.onClick',
    });
    const result = await action({ hello: 'put' });
    expect(request.method).toBe('put');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/actions/pages.0.blocks.0.actions.onClick`);
    expect(request.params).toBeUndefined();
    expect(request.data).toBe('{"hello":"put"}');
    expect(result).toStrictEqual({ hello: 'data' });
  });

  it('should support a body remapper', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [200, { hello: 'data' }, {}];
    });
    const action = createTestAction({
      definition: { type: 'request', method: 'post', body: { static: { remapped: 'data' } } },
      prefix: 'pages.test.blocks.0.actions.onClick',
      prefixIndex: 'pages.0.blocks.0.actions.onClick',
    });
    await action({ hello: 'post' });
    expect(request.data).toBe('{"remapped":"data"}');
  });

  it('should support disabling the proxy', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [200, 'Example content', {}];
    });
    const action = createTestAction({
      definition: { type: 'request', proxy: false, url: 'https://example.com' },
      prefix: 'pages.test.blocks.0.actions.onClick',
      prefixIndex: 'pages.0.blocks.0.actions.onClick',
    });
    const result = await action({ hello: 'get' });
    expect(request.method).toBe('get');
    expect(request.url).toBe('https://example.com');
    expect(request.params).toBeNull();
    expect(request.data).toBeUndefined();
    expect(result).toBe('Example content');
  });

  it('should allow for using context in url remappers', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [200, 'Example content', {}];
    });

    const action = createTestAction({
      definition: {
        type: 'request',
        url: {
          'string.format': {
            template: 'https://example.{domain}',
            values: {
              domain: { context: 'test' },
            },
          },
        },
        proxy: false,
      },
      prefix: 'pages.test.blocks.0.actions.onClick',
      prefixIndex: 'pages.0.blocks.0.actions.onClick',
    });

    const result = await action(null, { test: 'nl' });
    expect(request.method).toBe('get');
    expect(request.url).toBe('https://example.nl');
    expect(request.params).toBeNull();
    expect(request.data).toBeUndefined();
    expect(result).toBe('Example content');
  });

  it('should allow for using context in query remappers', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [200, 'Example content', {}];
    });

    const action = createTestAction({
      definition: {
        type: 'request',
        url: 'https://example.com',
        proxy: false,
        query: {
          'object.from': {
            example: { context: 'test' },
          },
        },
      },
      prefix: 'pages.test.blocks.0.actions.onClick',
      prefixIndex: 'pages.0.blocks.0.actions.onClick',
    });

    const result = await action(null, { test: 'foo' });
    expect(request.method).toBe('get');
    expect(request.url).toBe('https://example.com');
    expect(request.params).toStrictEqual({ example: 'foo' });
    expect(request.data).toBeUndefined();
    expect(result).toBe('Example content');
  });

  it('should allow for using context in body remappers', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [200, 'Example content', {}];
    });

    const action = createTestAction({
      definition: {
        type: 'request',
        url: 'https://example.com',
        method: 'post',
        proxy: false,
        body: { context: 'test' },
      },
      prefix: 'pages.test.blocks.0.actions.onClick',
      prefixIndex: 'pages.0.blocks.0.actions.onClick',
    });

    const result = await action(null, { test: { foo: 'bar', baz: 1234 } });
    expect(request.method).toBe('post');
    expect(request.url).toBe('https://example.com');
    expect(request.params).toBeNull();
    expect(request.data).toBe('{"foo":"bar","baz":1234}');
    expect(result).toBe('Example content');
  });

  it('should support deserializing an XML response', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [
        200,
        `<?xml version="1.0" encoding="UTF-8" ?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>Release notes from appsemble</title>
          <updated>2021-03-31T17:09:00+02:00</updated>
          <entry>
            <id>tag:github.com,2008:Repository/226361784/0.18.5</id>
            <updated>2021-03-31T17:09:00+02:00</updated>
            <title>Merge branch &#39;release-0.18.5&#39; into &#39;main&#39;</title>
            {/* eslint-disable-next-line react/forbid-elements */}
            <content type="html">&lt;p&gt;Release version 0.18.5&lt;/p&gt; &lt;p&gt;See merge request appsemble/appsemble!1747&lt;/p&gt;</content>
          </entry>
          <entry>
            <id>tag:github.com,2008:Repository/226361784/0.18.4</id>
            <updated>2021-03-24T17:40:15+01:00</updated>
            <title>Merge branch &#39;release-0.18.4&#39; into &#39;main&#39;</title>
            {/* eslint-disable-next-line react/forbid-elements */}
            <content type="html">&lt;p&gt;Release version 0.18.4&lt;/p&gt; &lt;p&gt;See merge request appsemble/appsemble!1734&lt;/p&gt;</content>
          </entry>
        </feed>`,
        { 'content-type': 'application/xml' },
      ];
    });
    const action = createTestAction({
      definition: {
        type: 'request',
        proxy: false,
        url: 'https://example.com',
        schema: {
          type: 'object',
          xml: { name: 'feed' },
          properties: {
            title: { type: 'string' },
            updated: { type: 'string' },
            entries: {
              type: 'array',
              items: {
                type: 'object',
                xml: { name: 'entry' },
                properties: {
                  id: { type: 'string' },
                  updated: { type: 'string' },
                  title: { type: 'string' },
                  content: { type: 'string' },
                },
              },
            },
          },
        },
      },
      prefix: 'pages.test.blocks.0.actions.onClick',
      prefixIndex: 'pages.0.blocks.0.actions.onClick',
    });
    const result = await action({ hello: 'get' });
    expect(result).toStrictEqual({
      title: 'Release notes from appsemble',
      updated: '2021-03-31T17:09:00+02:00',
      entries: [
        {
          content:
            '<p>Release version 0.18.5</p> <p>See merge request appsemble/appsemble!1747</p>',
          id: 'tag:github.com,2008:Repository/226361784/0.18.5',
          title: "Merge branch 'release-0.18.5' into 'main'",
          updated: '2021-03-31T17:09:00+02:00',
        },
        {
          content:
            '<p>Release version 0.18.4</p> <p>See merge request appsemble/appsemble!1734</p>',
          id: 'tag:github.com,2008:Repository/226361784/0.18.4',
          title: "Merge branch 'release-0.18.4' into 'main'",
          updated: '2021-03-24T17:40:15+01:00',
        },
      ],
    });
  });

  it('should support deserializing a JSON response', async () => {
    const data = {
      title: 'Release notes from appsemble',
      updated: '2021-03-31T17:09:00+02:00',
      entries: [
        {
          content:
            '<p>Release version 0.18.5</p> <p>See merge request appsemble/appsemble!1747</p>',
          id: 'tag:github.com,2008:Repository/226361784/0.18.5',
          title: "Merge branch 'release-0.18.5' into 'main'",
          updated: '2021-03-31T17:09:00+02:00',
        },
        {
          content:
            '<p>Release version 0.18.4</p> <p>See merge request appsemble/appsemble!1734</p>',
          id: 'tag:github.com,2008:Repository/226361784/0.18.4',
          title: "Merge branch 'release-0.18.4' into 'main'",
          updated: '2021-03-24T17:40:15+01:00',
        },
      ],
    };
    mock.onAny(/.*/).reply((req) => {
      request = req;
      if (req.responseType === 'arraybuffer') {
        return [
          200,
          new TextEncoder().encode(JSON.stringify(data)).buffer,
          { 'content-type': 'application/json' },
        ];
      }
      if (req.responseType === 'blob') {
        return [
          200,
          new Blob([JSON.stringify(data)], { type: 'application/json' }),
          { 'content-type': 'application/json' },
        ];
      }
      return [200, data, { 'content-type': 'application/json' }];
    });
    const action = createTestAction({
      definition: {
        type: 'request',
        proxy: false,
        url: 'https://example.com',
        schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            updated: { type: 'string' },
            entries: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  updated: { type: 'string' },
                  title: { type: 'string' },
                  content: { type: 'string' },
                },
              },
            },
          },
        },
      },
      prefix: 'pages.test.blocks.0.actions.onClick',
      prefixIndex: 'pages.0.blocks.0.actions.onClick',
    });
    const result = await action({ hello: 'get' });
    expect(result).toStrictEqual({
      title: 'Release notes from appsemble',
      updated: '2021-03-31T17:09:00+02:00',
      entries: [
        {
          content:
            '<p>Release version 0.18.5</p> <p>See merge request appsemble/appsemble!1747</p>',
          id: 'tag:github.com,2008:Repository/226361784/0.18.5',
          title: "Merge branch 'release-0.18.5' into 'main'",
          updated: '2021-03-31T17:09:00+02:00',
        },
        {
          content:
            '<p>Release version 0.18.4</p> <p>See merge request appsemble/appsemble!1734</p>',
          id: 'tag:github.com,2008:Repository/226361784/0.18.4',
          title: "Merge branch 'release-0.18.4' into 'main'",
          updated: '2021-03-24T17:40:15+01:00',
        },
      ],
    });
  });

  it('should return a blob when the response cannot be parsed as a string', async () => {
    // A minimal valid PNG file
    const data = [
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
      0x52, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x03, 0x00, 0x00, 0x00, 0x66,
      0xbc, 0x3a, 0x25, 0x00, 0x00, 0x00, 0x03, 0x50, 0x4c, 0x54, 0x45, 0xb5, 0xd0, 0xd0, 0x63,
      0x04, 0x16, 0xea, 0x00, 0x00, 0x00, 0x1f, 0x49, 0x44, 0x41, 0x54, 0x68, 0x81, 0xed, 0xc1,
      0x01, 0x0d, 0x00, 0x00, 0x00, 0xc2, 0xa0, 0xf7, 0x4f, 0x6d, 0x0e, 0x37, 0xa0, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xbe, 0x0d, 0x21, 0x00, 0x00, 0x01, 0x9a, 0x60, 0xe1,
      0xd5, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ];
    const typedData = new Uint8Array(data);
    const blob = new Blob([typedData], { type: 'image/png' });
    mock.onAny(/.*/).reply((req) => {
      request = req;
      if (req.responseType === 'arraybuffer') {
        return [200, typedData.buffer, { 'content-type': 'image/png' }];
      }
      if (req.responseType === 'blob') {
        return [200, blob, { 'content-type': 'image/png' }];
      }
      return [200, new TextDecoder().decode(new Uint8Array(data)), { 'content-type': 'image/png' }];
    });
    mock.onAny(/.*/).reply(200, blob, { 'content-type': 'image/png' });
    const action = createTestAction({
      definition: { type: 'request', proxy: false, url: 'https://example.com' },
      prefix: 'pages.test.blocks.0.actions.onClick',
      prefixIndex: 'pages.0.blocks.0.actions.onClick',
    });
    const result = await action({ hello: 'get' });
    expect(result).toBeInstanceOf(Blob);
    expect(result).toStrictEqual(blob);
  });

  it.each`
    requestType | expectedResult
    ${'GET'}    | ${{ data: '{"hello":"data"}', params: '{"key":"value"}' }}
    ${'DELETE'} | ${{ data: '{"hello":"data"}', params: '{"key":"value"}' }}
    ${'POST'}   | ${{ params: '{"key":"value"}' }}
    ${'PUT'}    | ${{ params: '{"key":"value"}' }}
    ${'PATCH'}  | ${{ params: '{"key":"value"}' }}
  `(
    'should support query parameters for $requestType requests when proxy is true',
    async ({ expectedResult, requestType }) => {
      mock.onAny(/.*/).reply((req) => {
        request = req;
        return [200, { hello: 'data' }, {}];
      });
      const action = createTestAction({
        definition: {
          type: 'request',
          method: requestType,
          proxy: true,
          query: { 'object.from': { key: 'value' } },
        },
        prefix: 'pages.test.blocks.0.actions.onClick',
        prefixIndex: 'pages.0.blocks.0.actions.onClick',
      });
      const result = await action({ hello: 'data' });
      expect(request.method).toBe(requestType.toLocaleLowerCase());
      expect(request.url).toBe(`${apiUrl}/api/apps/42/actions/pages.0.blocks.0.actions.onClick`);
      expect(request.params).toStrictEqual(expectedResult);
      expect(result).toStrictEqual({ hello: 'data' });
    },
  );

  it('should set parameter as end of URL when presented as a single string', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [200, { hello: 'data' }, {}];
    });
    const action = createTestAction({
      definition: {
        type: 'request',
        method: 'get',
        url: 'https://example.com/api',
        query: 0,
        proxy: false,
      },
    });
    const result = await action({ hello: 'get' });
    expect(request.method).toBe('get');
    expect(request.url).toBe('https://example.com/api/0');
    expect(request.params).toBeNull();
    expect(result).toStrictEqual({ hello: 'data' });
  });
});
