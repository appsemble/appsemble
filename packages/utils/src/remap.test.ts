import { AppMessages, Remapper, UserInfo } from '@appsemble/types';
import { Clock, install } from '@sinonjs/fake-timers';
import { IntlMessageFormat } from 'intl-messageformat';

import { remap } from './remap';

interface TestCase {
  input: any;
  mappers: Remapper;
  expected: any;
  messages?: AppMessages['messages'];
  userInfo?: UserInfo;
  context?: Record<string, any>;
}

function runTests(tests: Record<string, TestCase>): void {
  it.each(Object.entries(tests))(
    'should %s',
    (name, { context, expected, input, mappers, messages, userInfo }) => {
      const result = remap(mappers, input, {
        getMessage: ({ defaultMessage, id }) =>
          new IntlMessageFormat(messages?.messageIds?.[id] ?? defaultMessage),
        userInfo,
        context,
        appId: 6789,
      });
      expect(result).toStrictEqual(expected);
    },
  );
}

describe('Primitive values', () => {
  runTests({
    'return a literal string': {
      input: 'a string',
      mappers: 'raw string',
      expected: 'raw string',
    },
    'return a literal number': {
      input: 'a string',
      mappers: 42,
      expected: 42,
    },
    'return a literal boolean': {
      input: 'a string',
      mappers: false,
      expected: false,
    },
  });
});

describe('app', () => {
  runTests({
    'return the app id': {
      input: {},
      mappers: { app: 'id' },
      expected: 6789,
    },
  });
});

describe('context', () => {
  runTests({
    'get a simple property from context': {
      input: {},
      mappers: { context: 'name' },
      expected: 'Spongebob',
      context: { name: 'Spongebob' },
    },
    'get a nested property': {
      input: {},
      context: { address: { town: 'Bikini Bottom' } },
      mappers: { context: 'address.town' },
      expected: 'Bikini Bottom',
    },
    'handle null': {
      input: {},
      context: { name: 'Spongebob' },
      mappers: { context: null },
      expected: null,
    },
    'handle properties named null': {
      input: {},
      context: { null: 'Spongebob' },
      mappers: { context: null },
      expected: 'Spongebob',
    },
    'handle null values': {
      input: {},
      mappers: { context: 'foo.bar' },
      expected: null,
    },
    'return null if context is not available': {
      input: {},
      mappers: { context: 'test' },
      expected: null,
    },
  });
});

describe('date.now', () => {
  let clock: Clock;

  beforeEach(() => {
    clock = install();
  });

  afterEach(() => {
    clock.uninstall();
  });

  runTests({
    'return the current date': {
      input: 'whatever',
      mappers: { 'date.now': {} },
      expected: new Date(0),
    },
  });
});

describe('date.add', () => {
  let clock: Clock;

  beforeEach(() => {
    clock = install();
  });

  afterEach(() => {
    clock.uninstall();
  });

  runTests({
    'add 3 days to the given date': {
      input: 'whatever',
      mappers: [{ 'date.now': {} }, { 'date.add': '3d' }],
      expected: new Date(3 * 24 * 60 * 60 * 1e3),
    },
    'add 3 days to the given date as number': {
      input: 20e3,
      mappers: [{ 'date.add': '3d' }],
      expected: new Date(3 * 24 * 60 * 60 * 1e3 + 20e3),
    },
    'subtract 1 day from the given date': {
      input: 'whatever',
      mappers: [{ 'date.now': {} }, { 'date.add': '-1d' }],
      expected: new Date(-(24 * 60 * 60 * 1e3)),
    },
    'return input when input is nothing': {
      input: undefined,
      mappers: [{ 'date.add': '3d' }],
      expected: undefined,
    },
    'return input when input is not a date': {
      input: 'whatever',
      mappers: [{ 'date.add': '3d' }],
      expected: 'whatever',
    },
    'return input date when duration is invalid': {
      input: new Date(1000),
      mappers: [{ 'date.add': '3dd' }],
      expected: new Date(1000),
    },
  });
});

describe('equals', () => {
  runTests({
    'return true if all values are equal': {
      input: [1, 1, 1],
      mappers: { equals: [{ prop: '0' }, { prop: '1' }, { prop: '2' }] },
      expected: true,
    },
    'use deep equality': {
      input: [{ foo: { bar: 3 } }, { foo: { bar: 3 } }],
      mappers: { equals: [{ prop: '0' }, { prop: '1' }] },
      expected: true,
    },
    'return false if not all values are equal': {
      input: [{ foo: { bar: 3 } }, { foo: { bar: 2 } }],
      mappers: { equals: [{ prop: '0' }, { prop: '1' }] },
      expected: false,
    },
    'return true on empty arrays': {
      input: { empty: [] },
      mappers: { equals: [] },
      expected: true,
    },
    'return true on arrays with 1 entry': {
      input: { empty: [] },
      mappers: { equals: [{ prop: 'empty' }] },
      expected: true,
    },
  });
});

describe('if', () => {
  runTests({
    'return the value of then if condition is truthy': {
      input: { really: true },
      mappers: { if: { condition: { prop: 'really' }, else: 'no really', then: 'yes really' } },
      expected: 'yes really',
    },
    'return the value of else if condition is falsy': {
      input: { really: false },
      mappers: { if: { condition: { prop: 'really' }, else: 'no really', then: 'yes really' } },
      expected: 'no really',
    },
    'return the value of then if condition is empty': {
      input: { really: false },
      mappers: { if: { condition: [], else: 'no really', then: 'yes really' } },
      expected: 'yes really',
    },
    'return input if else is empty': {
      input: { really: false },
      mappers: { if: { condition: { prop: 'really' }, else: [], then: 'yes really' } },
      expected: { really: false },
    },
    'return input if then is empty': {
      input: { really: true },
      mappers: { if: { condition: { prop: 'really' }, else: 'no really', then: [] } },
      expected: { really: true },
    },
  });
});

describe('object.from', () => {
  runTests({
    'create a new object from remappers': {
      input: { givenName: 'Patrick', familyName: 'Star', species: 'Starfish' },
      mappers: {
        'object.from': { firstName: { prop: 'givenName' }, lastName: { prop: 'familyName' } },
      },

      expected: { firstName: 'Patrick', lastName: 'Star' },
    },
  });
});

describe('object.assign', () => {
  runTests({
    'assign to an object from remappers': {
      input: { givenName: 'Patrick', familyName: 'Star' },
      mappers: {
        'object.assign': {
          familyName: [{ prop: 'familyName' }, { 'string.case': 'lower' }],
          species: 'Starfish',
        },
      },

      expected: { givenName: 'Patrick', familyName: 'star', species: 'Starfish' },
    },
  });
});

describe('array.map', () => {
  runTests({
    'apply remappers to each array item': {
      input: [
        { firstName: 'John', lastName: 'Doe' },
        { firstName: 'Jane', lastName: 'Smith' },
      ],
      mappers: {
        'array.map': [
          {
            'string.format': {
              template: '{firstName} {lastName}',
              values: {
                firstName: { prop: 'firstName' },
                lastName: { prop: 'lastName' },
              },
            },
          },
          { 'string.case': 'lower' },
        ],
      },

      expected: ['john doe', 'jane smith'],
    },
  });
});

describe('array', () => {
  runTests({
    'return undefined if not in the context of array.map': {
      input: {},
      mappers: [
        {
          'object.from': {
            index: [{ array: 'index' }],
            length: [{ array: 'length' }],
          },
        },
      ],
      expected: { index: undefined, length: undefined },
    },
    'return the index and length if in the context of array.map': {
      input: { array: [{ value: 'a' }, { value: 'b' }, { value: 'c' }] },
      mappers: [
        { prop: 'array' },
        {
          'array.map': [
            {
              'object.from': {
                value: [{ prop: 'value' }],
                index: [{ array: 'index' }],
                length: [{ array: 'length' }],
              },
            },
            ,
          ],
        },
      ],
      expected: [
        { value: 'a', index: 0, length: 3 },
        { value: 'b', index: 1, length: 3 },
        { value: 'c', index: 2, length: 3 },
      ],
    },
  });
});

describe('prop', () => {
  runTests({
    'get a simple property': {
      input: { name: 'Spongebob' },
      mappers: { prop: 'name' },
      expected: 'Spongebob',
    },
    'get a nested property': {
      input: { address: { town: 'Bikini Bottom' } },
      mappers: { prop: 'address.town' },
      expected: 'Bikini Bottom',
    },
    'handle numbers': {
      input: { names: ['foo', 'bar'] },
      mappers: [{ prop: 'names' }, { prop: 0 as unknown as string }],
      expected: 'foo',
    },
    'handle null': {
      input: { name: 'Spongebob' },
      mappers: { prop: null },
      expected: undefined,
    },
    'handle properties named null': {
      input: { null: 'Spongebob' },
      mappers: { prop: null },
      expected: 'Spongebob',
    },
    'handle undefined values': {
      input: {},
      mappers: { prop: 'foo' },
      expected: undefined,
    },
    'handle null values': {
      input: { foo: null },
      mappers: { prop: 'foo' },
      expected: null,
    },
  });
});

describe('root', () => {
  runTests({
    'return the root input data': {
      input: { input: 'data' },
      mappers: [{ prop: 'input' }, { root: null }],
      expected: { input: 'data' },
    },
    'not overwrite the root in the context': {
      input: { input: 'data' },
      mappers: [{ prop: 'input' }, { 'object.from': { key: { root: null } } }],
      expected: { key: { input: 'data' } },
    },
  });
});

describe('string.case', () => {
  runTests({
    'convert a string to upper case': {
      input: 'I’m a Goofy Goober',
      mappers: { 'string.case': 'upper' },
      expected: 'I’M A GOOFY GOOBER',
    },
    'convert a string to lower case': {
      input: 'We’re all Goofy Goobers',
      mappers: { 'string.case': 'lower' },
      expected: 'we’re all goofy goobers',
    },
  });
});

describe('string.format', () => {
  runTests({
    'format a template string': {
      input: { name: 'Krusty Krab', food: 'krabby patties' },
      mappers: {
        'string.format': {
          template: 'The {restaurant} serves {highlight}',
          values: { restaurant: { prop: 'name' }, highlight: { prop: 'food' } },
        },
      },

      expected: 'The Krusty Krab serves krabby patties',
    },
    'escape formatting double curly brackets': {
      input: { food: 'krabby patty' },
      mappers: {
        'string.format': {
          template: "A {burger} can be ressembled in ascii using: '{{I}}'",
          values: { burger: { prop: 'food' } },
        },
      },
      expected: 'A krabby patty can be ressembled in ascii using: {{I}}',
    },
    'format unknown values to empty strings': {
      input: {},
      mappers: { 'string.format': { template: '‘{value}’ is unknown', values: {} } },
      expected:
        'The intl string context variable "value" was not provided to the string "‘{value}’ is unknown"',
    },
    'format dates it parsed': {
      input: { date: '1970-01-01T00:00:00.000Z' },
      mappers: {
        'string.format': {
          template: 'Date’s year: {year, date, :: yyyy}',
          values: { year: [{ prop: 'date' }, { 'date.parse': '' }] },
        },
      },
      expected: 'Date’s year: 1970',
    },
    'format multilingual messages': {
      input: null,
      mappers: {
        'string.format': {
          messageId: 'patty',
          values: { type: 'Krabby' },
        },
      },
      expected: 'Krabby Patty',
      messages: {
        core: {},
        app: {},
        blocks: {},
        messageIds: {
          patty: '{type} Patty',
        },
      },
    },
  });
});

describe('static', () => {
  runTests({
    'return a static value': {
      input: null,
      mappers: { static: 'Hello world' },
      expected: 'Hello world',
    },
    'return an object': {
      input: null,
      mappers: { static: { foo: { bar: 123 } } },
      expected: { foo: { bar: 123 } },
    },
    'return an array': {
      input: null,
      mappers: { static: [{ foo: 123 }, 321, [1, 2, 3]] },
      expected: [{ foo: 123 }, 321, [1, 2, 3]],
    },
    'apply regex replacements': {
      input: null,
      mappers: [{ static: '1234 AA' }, { 'string.replace': { '\\s+': '' } }],
      expected: '1234AA',
    },
  });
});

describe('translate', () => {
  runTests({
    'format multilingual messages': {
      input: null,
      mappers: {
        translate: 'patty',
      },
      expected: 'Patty',
      messages: {
        core: {},
        app: {},
        blocks: {},
        messageIds: {
          patty: 'Patty',
        },
      },
    },
    'handle untranslated multilingual messages': {
      input: null,
      mappers: {
        translate: 'patty',
      },
      expected: '{patty}',
      messages: {
        core: {},
        app: {},
        blocks: {},
        messageIds: {
          patty: '',
        },
      },
    },
  });
});

describe('user', () => {
  runTests({
    'insert user info': {
      input: null,
      mappers: { user: 'name' },
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
  });
});
