import { expect, it } from 'vitest';

import { xmlToJson } from './xmlToJson.js';

/*
 * All test cases are taken from the examples of https://swagger.io/specification/#xmlObject
 */

it('should handle top level strings', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <food>Frikandel</food>
  `;
  const result = xmlToJson(xml, {
    type: 'string',
    xml: { name: 'food' },
  });
  expect(result).toBe('Frikandel');
});

it('should handle top level true', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <is-it-working>true</is-it-working>
  `;
  const result = xmlToJson(xml, {
    type: 'boolean',
    xml: { name: 'is-it-working' },
  });
  expect(result).toBe(true);
});

it('should handle top level false', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <is-it-broken>false</is-it-broken>
  `;
  const result = xmlToJson(xml, {
    type: 'boolean',
    xml: { name: 'is-it-broken' },
  });
  expect(result).toBe(false);
});

it('should convert invalid boolean values to null', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <is-null>invalid</is-null>
  `;
  const result = xmlToJson(xml, {
    type: 'boolean',
    xml: { name: 'is-null' },
  });
  expect(result).toBeNull();
});

it('should handle top level integers', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <count>42.3</count>
  `;
  const result = xmlToJson(xml, {
    type: 'integer',
    xml: { name: 'count' },
  });
  expect(result).toBe(42);
});

it('should handle top level numbers', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <percentage>13.37</percentage>
  `;
  const result = xmlToJson(xml, {
    type: 'number',
    xml: { name: 'percentage' },
  });
  expect(result).toBe(13.37);
});

it('should handle top level objects', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <food>
      <name>Pizza</name>
    </food>
  `;
  const result = xmlToJson(xml, {
    type: 'object',
    xml: { name: 'food' },
    properties: {
      name: { type: 'string' },
    },
  });
  expect(result).toStrictEqual({
    name: 'Pizza',
  });
});

it('should handle top level wrapped arrays', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <food>
      <name>Pizza</name>
    </food>
  `;
  const result = xmlToJson(xml, {
    type: 'array',
    xml: { name: 'food', wrapped: true },
    items: {
      type: 'string',
      xml: { name: 'name' },
    },
  });
  expect(result).toStrictEqual(['Pizza']);
});

it('should use the first matching object property element', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <food>
      <name>Spaghetti</name>
      <name>Pizza</name>
    </food>
  `;
  const result = xmlToJson(xml, {
    type: 'object',
    xml: { name: 'food' },
    properties: {
      name: { type: 'string' },
    },
  });
  expect(result).toStrictEqual({
    name: 'Spaghetti',
  });
});

it('should handle nested objects', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <pizza>
      <name>Salami</name>
      <toppings>
        <tomatoes>true</tomatoes>
        <cheese>true</cheese>
        <salami>true</salami>
      </toppings>
    </pizza>
  `;
  const result = xmlToJson(xml, {
    type: 'object',
    xml: { name: 'pizza' },
    properties: {
      name: { type: 'string' },
      toppings: {
        type: 'object',
        properties: {
          tomatoes: { type: 'boolean' },
          cheese: { type: 'boolean' },
          salami: { type: 'boolean' },
        },
      },
    },
  });
  expect(result).toStrictEqual({
    name: 'Salami',
    toppings: {
      tomatoes: true,
      cheese: true,
      salami: true,
    },
  });
});

it('should handle wrapped arrays', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <ingredients>
      <name>flour</name>
      <name>water</name>
      <name>milk</name>
      <name>eggs</name>
    </ingredients>
  `;
  const result = xmlToJson(xml, {
    type: 'array',
    xml: { name: 'ingredients', wrapped: true },
    items: {
      type: 'string',
      xml: { name: 'name' },
    },
  });
  expect(result).toStrictEqual(['flour', 'water', 'milk', 'eggs']);
});

it('should handle unwrapped arrays', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <ingredients>
      <name>flour</name>
      <name>water</name>
      <name>milk</name>
      <name>eggs</name>
    </ingredients>
  `;
  const result = xmlToJson(xml, {
    type: 'object',
    xml: { name: 'ingredients' },
    properties: {
      name: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
  });
  expect(result).toStrictEqual({ name: ['flour', 'water', 'milk', 'eggs'] });
});

it('should handle namespaces', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <food xmlns:pizza="https://example.com/pizza">
      <pizza:name>Margherita</pizza:name>
    </food>
  `;
  const result = xmlToJson(xml, {
    type: 'object',
    xml: { name: 'food' },
    properties: {
      name: {
        type: 'string',
        xml: { prefix: 'pizza' },
      },
    },
  });
  expect(result).toStrictEqual({ name: 'Margherita' });
});

it('should handle attributes', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <food name="bread" />
  `;
  const result = xmlToJson(xml, {
    type: 'object',
    xml: { name: 'food' },
    properties: {
      name: {
        type: 'string',
        xml: { attribute: true },
      },
    },
  });
  expect(result).toStrictEqual({ name: 'bread' });
});

it('should handle namespaced attributes', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <food candy:name="Napoleon" xmlns:candy="https://example.com/candy" />
  `;
  const result = xmlToJson(xml, {
    type: 'object',
    xml: { name: 'food' },
    properties: {
      name: {
        type: 'string',
        xml: { attribute: true, prefix: 'candy' },
      },
    },
  });
  expect(result).toStrictEqual({ name: 'Napoleon' });
});

it('should convert undefined attributes to null', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <food />
  `;
  const result = xmlToJson(xml, {
    type: 'object',
    xml: { name: 'food' },
    properties: {
      category: {
        type: 'string',
      },
    },
  });
  expect(result).toStrictEqual({ category: null });
});

it('should throw if a parser error is found', () => {
  const xml = 'invalid';
  expect(() => xmlToJson(xml, { type: 'string' })).toThrowError(
    '1:7: text data outside of root node.',
  );
});

it('should be able to parse an RSS feed', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0"
      xmlns:content="http://purl.org/rss/1.0/modules/content/"
      xmlns:wfw="http://wellformedweb.org/CommentAPI/"
      xmlns:dc="http://purl.org/dc/elements/1.1/"
      xmlns:atom="http://www.w3.org/2005/Atom"
      xmlns:sy="http://purl.org/rss/1.0/modules/syndication/"
      xmlns:slash="http://purl.org/rss/1.0/modules/slash/"
    >
      <channel>
        <title>Appsemble</title>
        <atom:link href="https://appsemble.com/feed/" rel="self" type="application/rss+xml" />
        <link>https://appsemble.com</link>
        <description>Open source low-code platform</description>
        <lastBuildDate>Tue, 12 Nov 2019 15:44:38 +0000</lastBuildDate>
        <language>nl</language>
        <sy:updatePeriod>hourly</sy:updatePeriod>
        <sy:updateFrequency>1</sy:updateFrequency>
        <generator>https://wordpress.org/?v=5.2.4</generator>

        <image>
          <url>https://appsemble.com/wp-content/uploads/2019/03/cropped-Appsemble-logo-512-1-32x32.png</url>
          <title>Appsemble</title>
          <link>https://appsemble.com</link>
          <width>32</width>
          <height>32</height>
        </image>

        <item>
          <title>Item 2</title>
          <link>https://appsemble.com</link>
          <comments>https://appsemble.com/low-code/#respond</comments>
          <pubDate>Fri, 05 Jul 2019 10:15:23 +0000</pubDate>
          <dc:creator><![CDATA[Appsemble]]></dc:creator>
          <category><![CDATA[Informatie]]></category>

          <guid isPermaLink="false">https://appsemble.com/?p=1190</guid>
          <description>Foo</description>
        </item>

        <item>
          <title>Item 1</title>
          <link>https://appsemble.com</link>
          <comments>https://appsemble.com/low-code/#respond</comments>
          <pubDate>Fri, 05 Jul 2019 10:15:23 +0000</pubDate>
          <dc:creator><![CDATA[Appsemble]]></dc:creator>
          <category><![CDATA[Informatie]]></category>

          <guid isPermaLink="false">https://appsemble.com/?p=1190</guid>
          <description>Foo</description>
        </item>
      </channel>
    </rss>
  `;
  const result = xmlToJson(xml, {
    type: 'object',
    xml: { name: 'rss' },
    properties: {
      channel: {
        type: 'array',
        xml: { wrapped: true },
        items: {
          type: 'object',
          xml: { name: 'item' },
          properties: {
            title: { type: 'string' },
            link: { type: 'string' },
            comments: { type: 'string' },
            pubDate: { type: 'string' },
            creator: {
              type: 'string',
              xml: { prefix: 'dc' },
            },
            category: { type: 'string' },
            guid: { type: 'string' },
            guidIsPermaLink: {
              type: 'object',
              xml: { name: 'guid' },
              properties: {
                isPermaLink: {
                  type: 'boolean',
                  xml: { attribute: true },
                },
              },
            },
            description: { type: 'string' },
          },
        },
      },
    },
  });
  expect(result).toStrictEqual({
    channel: [
      {
        category: 'Informatie',
        comments: 'https://appsemble.com/low-code/#respond',
        creator: 'Appsemble',
        description: 'Foo',
        guid: 'https://appsemble.com/?p=1190',
        guidIsPermaLink: {
          isPermaLink: false,
        },
        link: 'https://appsemble.com',
        pubDate: 'Fri, 05 Jul 2019 10:15:23 +0000',
        title: 'Item 2',
      },
      {
        category: 'Informatie',
        comments: 'https://appsemble.com/low-code/#respond',
        creator: 'Appsemble',
        description: 'Foo',
        guid: 'https://appsemble.com/?p=1190',
        guidIsPermaLink: {
          isPermaLink: false,
        },
        link: 'https://appsemble.com',
        pubDate: 'Fri, 05 Jul 2019 10:15:23 +0000',
        title: 'Item 1',
      },
    ],
  });
});

it('should be able to parse an Atom RSS feed', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <feed
      xmlns="http://www.w3.org/2005/Atom"
      xmlns:thr="http://purl.org/syndication/thread/1.0"
      xml:lang="nl"
      xml:base="https://appsemble.com/wp-atom.php"
    >
      <title type="text">Appsemble</title>
      <subtitle type="text">Open source low-code platform</subtitle>
      <updated>2019-11-12T15:44:38Z</updated>
      <link rel="alternate" type="text/html" href="https://appsemble.com" />
      <id>https://appsemble.com/feed/atom/</id>
      <link rel="self" type="application/atom+xml" href="https://appsemble.com/feed/atom/" />
      <generator uri="https://wordpress.org/" version="5.2.4">WordPress</generator>
      <icon>https://appsemble.com/wp-content/uploads/2019/03/cropped-Appsemble-logo-512-1-32x32.png</icon>
      <entry>
        <author>
          <name>Appsemble</name>
        </author>
        <title type="html"><![CDATA[low-code]]></title>
        <link rel="alternate" type="text/html" href="https://appsemble.com/low-code/?utm_source=rss&#038;utm_medium=rss&#038;utm_campaign=low-code" />
        <id>https://appsemble.com/?p=1190</id>
        <updated>2019-07-05T10:52:30Z</updated>
        <published>2019-07-05T10:15:23Z</published>
        <category scheme="https://appsemble.com" term="Informatie" />
        <summary type="html"></summary>
        <content type="html"></content>
      </entry>
      <entry>
        <author>
          <name>Appsemble</name>
        </author>
        <title type="html"><![CDATA[low-code]]></title>
        <link rel="alternate" type="text/html" href="https://appsemble.com/low-code/?utm_source=rss&#038;utm_medium=rss&#038;utm_campaign=low-code" />
        <id>https://appsemble.com/?p=1190</id>
        <updated>2019-07-05T10:52:30Z</updated>
        <published>2019-07-05T10:15:23Z</published>
        <category scheme="https://appsemble.com" term="Informatie" />
        <summary type="html"></summary>
        <content type="html"></content>
      </entry>
    </feed>
  `;
  const result = xmlToJson(xml, {
    type: 'array',
    xml: { name: 'feed', wrapped: true },
    items: {
      type: 'object',
      xml: { name: 'entry' },
      properties: {
        title: { type: 'string' },
        subtitle: { type: 'string' },
        link: {
          type: 'object',
          properties: {
            href: {
              type: 'string',
              xml: { attribute: true },
            },
          },
        },
        id: { type: 'string' },
        updated: { type: 'string' },
        published: { type: 'string' },
        category: {
          type: 'object',
          properties: {
            term: { type: 'string', xml: { attribute: true } },
          },
        },
        summary: { type: 'string' },
        content: { type: 'string' },
      },
    },
  });
  expect(result).toStrictEqual([
    {
      category: { term: 'Informatie' },
      content: '',
      id: 'https://appsemble.com/?p=1190',
      link: {
        href: 'https://appsemble.com/low-code/?utm_source=rss&utm_medium=rss&utm_campaign=low-code',
      },
      published: '2019-07-05T10:15:23Z',
      subtitle: null,
      summary: '',
      title: 'low-code',
      updated: '2019-07-05T10:52:30Z',
    },
    {
      category: { term: 'Informatie' },
      content: '',
      id: 'https://appsemble.com/?p=1190',
      link: {
        href: 'https://appsemble.com/low-code/?utm_source=rss&utm_medium=rss&utm_campaign=low-code',
      },
      published: '2019-07-05T10:15:23Z',
      subtitle: null,
      summary: '',
      title: 'low-code',
      updated: '2019-07-05T10:52:30Z',
    },
  ]);
});
