import xmlToJson from './xmlToJson';

const exampleXmlA = `
<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"
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
    <title>low-code</title>
    <link>https://appsemble.com/low-code/?utm_source=rss&#038;utm_medium=rss&#038;utm_campaign=low-code</link>
    <comments>https://appsemble.com/low-code/#respond</comments>
    <pubDate>Fri, 05 Jul 2019 10:15:23 +0000</pubDate>
    <dc:creator><![CDATA[Appsemble]]></dc:creator>
    <category><![CDATA[Informatie]]></category>
    <guid isPermaLink="false">https://appsemble.com/?p=1190</guid>
    <description><![CDATA[<p>Wat is low-code?</p>]]></description>
    <content:encoded><![CDATA[<h2><strong>Wat is low-code?</strong></h2>]]></content:encoded>
  </item>
  <item>
    <title>Laatste nieuws &#8211; Juni</title>
    <link>https://appsemble.com/laatste-nieuws-juni/?utm_source=rss&#038;utm_medium=rss&#038;utm_campaign=laatste-nieuws-juni</link>
    <pubDate>Thu, 20 Jun 2019 12:55:56 +0000</pubDate>
    <dc:creator><![CDATA[Appsemble]]></dc:creator>
    <category><![CDATA[Update]]></category>
    <guid isPermaLink="false">https://appsemble.com/?p=1147</guid>
    <description><![CDATA[<p>Videoverslag bijeenkomst Utrecht</p>]]></description>
    <content:encoded><![CDATA[<h4><strong>Videoverslag bijeenkomst Utrecht</strong></h4>]]></content:encoded>
  </item>
</channel>
</rss>
`;

describe('xmlToJson', () => {
  it('should parse XML children as properties', () => {
    const input = `
    <note>
      <to>Tove</to>
      <from>Jani</from>
      <heading>Reminder</heading>
      <body>Don't forget me this weekend!</body>
    </note>`;

    const parser = new DOMParser();
    expect(
      xmlToJson((parser.parseFromString(input, 'text/xml') as unknown) as Element),
    ).toStrictEqual({
      note: {
        to: 'Tove',
        from: 'Jani',
        heading: 'Reminder',
        body: "Don't forget me this weekend!",
      },
    });
  });

  it('should parse XML attributes', async () => {
    const input = `
      <menu>
        <item price="€5" name="Waffles" />
        <item price="€3" name="Pancakes" />
        <item price="€8" name="Pizza" pineapple="false" />
      </menu>
    `;
    const parser = new DOMParser();
    const xml = xmlToJson((parser.parseFromString(input, 'text/xml') as unknown) as Element);

    expect(xml).toStrictEqual({
      menu: {
        item: [
          { price: '€5', name: 'Waffles' },
          { price: '€3', name: 'Pancakes' },
          { price: '€8', name: 'Pizza', pineapple: 'false' },
        ],
      },
    });
  });

  it('should combine children and attributes', () => {
    const input = `
      <menu>
        <item price="€5" name="Waffles">
          <ingredient>Waf</ingredient>
          <ingredient>Fle</ingredient>
          <somethingElse>something</somethingElse>
        </item>
        <item price="€3" name="Pancakes" />
        <item price="€8" name="Pizza" pineapple="false" />
      </menu>
    `;
    const parser = new DOMParser();
    const xml = xmlToJson((parser.parseFromString(input, 'text/xml') as unknown) as Element);

    expect(xml).toStrictEqual({
      menu: {
        item: [
          { price: '€5', name: 'Waffles', ingredient: ['Waf', 'Fle'], somethingElse: 'something' },
          { price: '€3', name: 'Pancakes' },
          {
            price: '€8',
            name: 'Pizza',
            pineapple: 'false',
          },
        ],
      },
    });
  });

  it('should convert an RSS feed to JSON', () => {
    const parser = new DOMParser();
    const xml = xmlToJson((parser.parseFromString(exampleXmlA, 'text/xml') as unknown) as Element);

    expect(xml).toStrictEqual({
      rss: {
        'xmlns:slash': 'http://purl.org/rss/1.0/modules/slash/',
        'xmlns:sy': 'http://purl.org/rss/1.0/modules/syndication/',
        'xmlns:atom': 'http://www.w3.org/2005/Atom',
        'xmlns:dc': 'http://purl.org/dc/elements/1.1/',
        'xmlns:wfw': 'http://wellformedweb.org/CommentAPI/',
        'xmlns:content': 'http://purl.org/rss/1.0/modules/content/',
        version: '2.0',
        channel: {
          title: 'Appsemble',
          'atom:link': {
            href: 'https://appsemble.com/feed/',
            rel: 'self',
            type: 'application/rss+xml',
          },
          link: 'https://appsemble.com',
          description: 'Open source low-code platform',
          lastBuildDate: 'Tue, 12 Nov 2019 15:44:38 +0000',
          language: 'nl',
          'sy:updatePeriod': 'hourly',
          'sy:updateFrequency': '1',
          generator: 'https://wordpress.org/?v=5.2.4',
          image: {
            url:
              'https://appsemble.com/wp-content/uploads/2019/03/cropped-Appsemble-logo-512-1-32x32.png',
            title: 'Appsemble',
            link: 'https://appsemble.com',
            width: '32',
            height: '32',
          },
          item: [
            {
              title: 'low-code',
              link:
                'https://appsemble.com/low-code/?utm_source=rss&utm_medium=rss&utm_campaign=low-code',
              comments: 'https://appsemble.com/low-code/#respond',
              pubDate: 'Fri, 05 Jul 2019 10:15:23 +0000',
              'dc:creator': 'Appsemble',
              category: 'Informatie',
              guid: {
                _: 'https://appsemble.com/?p=1190',
                isPermaLink: 'false',
              },
              description: '<p>Wat is low-code?</p>',
              'content:encoded': '<h2><strong>Wat is low-code?</strong></h2>',
            },
            {
              title: 'Laatste nieuws – Juni',
              link:
                'https://appsemble.com/laatste-nieuws-juni/?utm_source=rss&utm_medium=rss&utm_campaign=laatste-nieuws-juni',
              pubDate: 'Thu, 20 Jun 2019 12:55:56 +0000',
              'dc:creator': 'Appsemble',
              category: 'Update',
              guid: {
                _: 'https://appsemble.com/?p=1147',
                isPermaLink: 'false',
              },
              description: '<p>Videoverslag bijeenkomst Utrecht</p>',
              'content:encoded': '<h4><strong>Videoverslag bijeenkomst Utrecht</strong></h4>',
            },
          ],
        },
      },
    });
  });
});
