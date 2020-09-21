import type { AppMessages, Remapper, UserInfo } from '@appsemble/types';
import { IntlMessageFormat } from 'intl-messageformat';

import { remap } from './remap';

interface TestCase {
  description: string;
  input: any;
  mappers: Remapper;
  expected: any;
  messages?: AppMessages['messages'];
  userInfo?: UserInfo;
  context?: { [key: string]: any };
}

function runTests(cases: TestCase[]): void {
  const tests = cases.map(
    ({ context, description, expected, input, mappers, messages, userInfo }) =>
      [description, mappers, messages, input, expected, userInfo, context] as const,
  );

  it.each(tests)(
    'should %s given %j',
    (_, mappers, messages, input, expected, userInfo, context) => {
      const result = remap(mappers, input, {
        getMessage: ({ defaultMessage, id }) =>
          new IntlMessageFormat(messages?.[id] ?? defaultMessage),
        userInfo,
        context,
      });
      expect(result).toStrictEqual(expected);
    },
  );
}

describe('Raw string', () => {
  const cases: TestCase[] = [
    {
      description: 'return a literal string',
      input: 'a string',
      mappers: 'raw string',
      expected: 'raw string',
    },
  ];

  runTests(cases);
});

describe('context', () => {
  const cases: TestCase[] = [
    {
      description: 'get a simple property from context',
      input: {},
      mappers: [{ context: 'name' }],
      expected: 'Spongebob',
      context: { name: 'Spongebob' },
    },
    {
      description: 'get a nested property',
      input: {},
      context: { address: { town: 'Bikini Bottom' } },
      mappers: [{ context: 'address.town' }],
      expected: 'Bikini Bottom',
    },
    {
      description: 'handle null',
      input: {},
      context: { name: 'Spongebob' },
      mappers: [{ context: null }],
      expected: null,
    },
    {
      description: 'handle properties named null',
      input: {},
      context: { null: 'Spongebob' },
      mappers: [{ context: null }],
      expected: 'Spongebob',
    },
    {
      description: 'handle null values',
      input: {},
      mappers: [{ context: 'foo.bar' }],
      expected: null,
    },
  ];

  runTests(cases);
});

describe('object.from', () => {
  const cases: TestCase[] = [
    {
      description: 'create a new object from remappers',
      input: { givenName: 'Patrick', familyName: 'Star', species: 'Starfish' },
      mappers: [
        {
          'object.from': { firstName: [{ prop: 'givenName' }], lastName: [{ prop: 'familyName' }] },
        },
      ],
      expected: { firstName: 'Patrick', lastName: 'Star' },
    },
  ];

  runTests(cases);
});

describe('array.map', () => {
  const cases: TestCase[] = [
    {
      description: 'return an empty array',
      input: {},
      mappers: [{ 'array.map': [] }],
      expected: [],
    },
    {
      description: 'apply remappers to each array item',
      input: [
        { firstName: 'John', lastName: 'Doe' },
        { firstName: 'Jane', lastName: 'Smith' },
      ],
      mappers: [
        {
          'array.map': [
            [
              {
                'string.format': {
                  template: '{firstName} {lastName}',
                  values: {
                    firstName: [{ prop: 'firstName' }],
                    lastName: [{ prop: 'lastName' }],
                  },
                },
              },
              { 'string.case': 'lower' },
            ],
          ],
        },
      ],
      expected: ['john doe', 'jane smith'],
    },
  ];

  runTests(cases);
});

describe('prop', () => {
  const cases: TestCase[] = [
    {
      description: 'get a simple property',
      input: { name: 'Spongebob' },
      mappers: [{ prop: 'name' }],
      expected: 'Spongebob',
    },
    {
      description: 'get a nested property',
      input: { address: { town: 'Bikini Bottom' } },
      mappers: [{ prop: 'address.town' }],
      expected: 'Bikini Bottom',
    },
    {
      description: 'handle numbers',
      input: { names: ['foo', 'bar'] },
      mappers: [{ prop: 'names' }, { prop: (0 as unknown) as string }],
      expected: 'foo',
    },
    {
      description: 'handle null',
      input: { name: 'Spongebob' },
      mappers: [{ prop: null }],
      expected: null,
    },
    {
      description: 'handle properties named null',
      input: { null: 'Spongebob' },
      mappers: [{ prop: null }],
      expected: 'Spongebob',
    },
    {
      description: 'handle null values',
      input: {},
      mappers: [{ prop: 'foo.bar' }],
      expected: null,
    },
  ];

  runTests(cases);
});

describe('string.case', () => {
  const cases: TestCase[] = [
    {
      description: 'convert a string to upper case',
      input: 'I’m a Goofy Goober',
      mappers: [{ 'string.case': 'upper' }],
      expected: 'I’M A GOOFY GOOBER',
    },
    {
      description: 'convert a string to lower case',
      input: 'We’re all Goofy Goobers',
      mappers: [{ 'string.case': 'lower' }],
      expected: 'we’re all goofy goobers',
    },
  ];

  runTests(cases);
});

describe('string.format', () => {
  const cases: TestCase[] = [
    {
      description: 'format a template string',
      input: { name: 'Krusty Krab', food: 'krabby patties' },
      mappers: [
        {
          'string.format': {
            template: 'The {restaurant} serves {highlight}',
            values: { restaurant: [{ prop: 'name' }], highlight: [{ prop: 'food' }] },
          },
        },
      ],
      expected: 'The Krusty Krab serves krabby patties',
    },
    {
      description: 'escape formatting double curly brackets',
      input: { food: 'krabby patty' },
      mappers: [
        {
          'string.format': {
            template: "A {burger} can be ressembled in ascii using: '{{I}}'",
            values: { burger: [{ prop: 'food' }] },
          },
        },
      ],
      expected: 'A krabby patty can be ressembled in ascii using: {{I}}',
    },
    {
      description: 'format unknown values to empty strings',
      input: {},
      mappers: [{ 'string.format': { template: '‘{value}’ is unknown', values: {} } }],
      expected:
        'The intl string context variable "value" was not provided to the string "‘{value}’ is unknown"',
    },
    {
      description: 'format dates it parsed',
      input: { date: '1970-01-01T00:00:00.000Z' },
      mappers: [
        {
          'string.format': {
            template: 'Date’s year: {year, date, :: yyyy}',
            values: { year: [{ prop: 'date' }, { 'date.parse': "yyyy-MM-dd'T'HH:mm:ss.SSSX" }] },
          },
        },
      ],
      expected: 'Date’s year: 1970',
    },
    {
      description: 'format multilingual messages',
      input: null,
      mappers: [
        {
          'string.format': {
            messageId: 'patty',
            values: { type: [{ static: 'Krabby' }] },
          },
        },
      ],
      expected: 'Krabby Patty',
      messages: {
        patty: '{type} Patty',
      },
    },
  ];

  runTests(cases);
});

describe('static', () => {
  const cases: TestCase[] = [
    {
      description: 'return a static value',
      input: null,
      mappers: [{ static: 'Hello world' }],
      expected: 'Hello world',
    },
    {
      description: 'apply regex replacements',
      input: null,
      mappers: [{ static: '1234 AA' }, { 'string.replace': { '\\s+': '' } }],
      expected: '1234AA',
    },
  ];

  runTests(cases);
});

describe('user', () => {
  const cases: TestCase[] = [
    {
      description: 'should insert user info',
      input: null,
      mappers: [{ user: 'name' }],
      expected: 'Me',
      userInfo: {
        sub: '1',
        name: 'Me',
        email: 'me@example.com',
        email_verified: true,
        picture: '',
        profile: '',
      },
    },
  ];

  runTests(cases);
});
