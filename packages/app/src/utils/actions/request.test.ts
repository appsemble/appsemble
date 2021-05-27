/** @jsx x */
/** @jsxFrag null */
/** @jsxRuntime classic */
import { remap } from '@appsemble/utils';
import axios, { AxiosRequestConfig } from 'axios';
import MockAdapter from 'axios-mock-adapter';

import { createTestAction } from '../makeActions';
import { apiUrl } from '../settings';

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
      prefix: 'pages.0.blocks.0.actions.onClick',
    });
    const result = await action({ hello: 'get' });
    expect(request.method).toBe('get');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/action/pages.0.blocks.0.actions.onClick`);
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
      prefix: 'pages.0.blocks.0.actions.onClick',
    });
    const result = await action({ hello: 'delete' });
    expect(request.method).toBe('delete');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/action/pages.0.blocks.0.actions.onClick`);
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
    });
    const result = await action({ hello: 'get' });
    expect(request.method).toBe('get');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/action/pages.0.blocks.0.actions.onClick`);
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
      prefix: 'pages.0.blocks.0.actions.onClick',
    });
    const result = await action({ hello: 'patch' });
    expect(request.method).toBe('patch');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/action/pages.0.blocks.0.actions.onClick`);
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
      prefix: 'pages.0.blocks.0.actions.onClick',
    });
    const result = await action({ hello: 'post' });
    expect(request.method).toBe('post');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/action/pages.0.blocks.0.actions.onClick`);
    expect(request.params).toBeUndefined();
    expect(request.data).toBe('{"hello":"post"}');
    expect(result).toStrictEqual({ hello: 'data' });
  });

  it('should support PUT', async () => {
    mock.onAny(/.*/).reply((req) => {
      request = req;
      return [200, { hello: 'data' }, {}];
    });
    const action = createTestAction({
      definition: { type: 'request', method: 'put' },
      prefix: 'pages.0.blocks.0.actions.onClick',
    });
    const result = await action({ hello: 'put' });
    expect(request.method).toBe('put');
    expect(request.url).toBe(`${apiUrl}/api/apps/42/action/pages.0.blocks.0.actions.onClick`);
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
      prefix: 'pages.0.blocks.0.actions.onClick',
      remap,
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
      prefix: 'pages.0.blocks.0.actions.onClick',
      remap,
    });
    const result = await action({ hello: 'get' });
    expect(request.method).toBe('get');
    expect(request.url).toBe('https://example.com');
    expect(request.params).toBeUndefined();
    expect(request.data).toBeUndefined();
    expect(result).toStrictEqual('Example content');
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
      prefix: 'pages.0.blocks.0.actions.onClick',
      remap,
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
});
