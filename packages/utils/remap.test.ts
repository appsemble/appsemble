import { AppMessages, Remapper, UserInfo } from '@appsemble/types';

import { IntlMessageFormat } from './intl-messageformat.js';
import { remap } from './remap.js';

interface TestCase {
  input: any;
  mappers: Remapper;
  expected: any;
  messages?: AppMessages['messages'];
  userInfo?: UserInfo;
  context?: Record<string, any>;
  history?: unknown[];
}

function runTests(tests: Record<string, TestCase>): void {
  it.each(Object.entries(tests))(
    'should %s',
    (name, { context, expected, history, input, mappers, messages, userInfo }) => {
      const result = remap(mappers, input, {
        getMessage: ({ defaultMessage, id }) =>
          new IntlMessageFormat(messages?.messageIds?.[id] ?? defaultMessage),
        url: 'https://example.com/en/example',
        appUrl: 'https://example.com',
        userInfo,
        context,
        history,
        appId: 6789,
        locale: 'en',
        pageData: { hello: 'Page data' },
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
    'return the curent url': {
      input: {},
      mappers: { app: 'url' },
      expected: 'https://example.com',
    },
    'return the current locale': {
      input: {},
      mappers: { app: 'locale' },
      expected: 'en',
    },
  });
});

describe('page', () => {
  runTests({
    'return the page url': {
      input: {},
      mappers: { page: 'url' },
      expected: 'https://example.com/en/example',
    },
  });

  runTests({
    'return page data': {
      input: {},
      mappers: { page: 'data' },
      expected: { hello: 'Page data' },
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
  beforeEach(() => {
    import.meta.jest.useFakeTimers({ now: 0 });
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
  beforeEach(() => {
    import.meta.jest.useFakeTimers({ now: 0 });
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

describe('le', () => {
  runTests({
    'return true if the left value is less than the right value': {
      input: { left: 42, right: 420 },
      mappers: { lt: [{ prop: 'left' }, { prop: 'right' }] },
      expected: true,
    },
    'work with dates': {
      input: { left: new Date(200_000), right: new Date(0) },
      mappers: { gt: [{ prop: 'left' }, { prop: 'right' }] },
      expected: true,
    },
    'work with strings': {
      input: { left: 'aa', right: 'a' },
      mappers: { gt: [{ prop: 'left' }, { prop: 'right' }] },
      expected: true,
    },
  });
});

describe('ge', () => {
  runTests({
    'return true if the left value is greater than the right value': {
      input: { left: 420, right: 42 },
      mappers: { gt: [{ prop: 'left' }, { prop: 'right' }] },
      expected: true,
    },
    'work with dates': {
      input: { left: new Date(200_000), right: new Date(0) },
      mappers: { gt: [{ prop: 'left' }, { prop: 'right' }] },
      expected: true,
    },
    'work with strings': {
      input: { left: 'aa', right: 'a' },
      mappers: { gt: [{ prop: 'left' }, { prop: 'right' }] },
      expected: true,
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

describe('ics', () => {
  runTests({
    'support string date': {
      input: {
        date: '2023-01-01T00:00:00Z',
        title: 'Happy new year!',
        description: 'Best wishes for 2023 🍾',
        url: 'https://example.com',
        location: 'Earth',
        latlng: [0, 0],
      },
      mappers: [
        {
          ics: {
            start: { prop: 'date' },
            title: { prop: 'title' },
            description: { prop: 'description' },
            duration: '24h',
            url: { prop: 'url' },
            location: { prop: 'location' },
            coordinates: { prop: 'latlng' },
          },
        },
        { 'string.replace': { 'UID:[\\w-]+': 'UID:UID_STUB' } },
        { 'string.replace': { 'DTSTAMP:\\w+': 'DTSTAMP:DTSTAMP_STUB' } },
      ],
      expected: `BEGIN:VCALENDAR\r
VERSION:2.0\r
CALSCALE:GREGORIAN\r
PRODID:https://example.com\r
METHOD:PUBLISH\r
X-PUBLISHED-TTL:PT1H\r
BEGIN:VEVENT\r
UID:UID_STUB\r
SUMMARY:Happy new year!\r
DTSTAMP:DTSTAMP_STUB\r
DTSTART:20230101T000000Z\r
DESCRIPTION:Best wishes for 2023 🍾\r
URL:https://example.com\r
GEO:0;0\r
LOCATION:Earth\r
DURATION:P1DT\r
END:VEVENT\r
END:VCALENDAR\r
`,
    },
    'support JavaScript date': {
      input: {
        date: new Date('2023-01-01T00:00:00Z'),
        title: 'Happy new year!',
        description: 'Best wishes for 2023 🍾',
        url: 'https://example.com',
        location: 'Earth',
        latlng: [0, 0],
      },
      mappers: [
        {
          ics: {
            start: { prop: 'date' },
            title: { prop: 'title' },
            description: { prop: 'description' },
            duration: '24h',
            url: { prop: 'url' },
            location: { prop: 'location' },
            coordinates: { prop: 'latlng' },
          },
        },
        { 'string.replace': { 'UID:[\\w-]+': 'UID:UID_STUB' } },
        { 'string.replace': { 'DTSTAMP:\\w+': 'DTSTAMP:DTSTAMP_STUB' } },
      ],
      expected: `BEGIN:VCALENDAR\r
VERSION:2.0\r
CALSCALE:GREGORIAN\r
PRODID:https://example.com\r
METHOD:PUBLISH\r
X-PUBLISHED-TTL:PT1H\r
BEGIN:VEVENT\r
UID:UID_STUB\r
SUMMARY:Happy new year!\r
DTSTAMP:DTSTAMP_STUB\r
DTSTART:20230101T000000Z\r
DESCRIPTION:Best wishes for 2023 🍾\r
URL:https://example.com\r
GEO:0;0\r
LOCATION:Earth\r
DURATION:P1DT\r
END:VEVENT\r
END:VCALENDAR\r
`,
    },

    'support end string date': {
      input: {
        date: '2023-01-01T00:00:00Z',
        endDate: '2023-01-02T00:00:00Z',
        title: 'Happy new year!',
        description: 'Best wishes for 2023 🍾',
        url: 'https://example.com',
        location: 'Earth',
        latlng: [0, 0],
      },
      mappers: [
        {
          ics: {
            start: { prop: 'date' },
            title: { prop: 'title' },
            description: { prop: 'description' },
            end: { prop: 'endDate' },
            url: { prop: 'url' },
            location: { prop: 'location' },
            coordinates: { prop: 'latlng' },
          },
        },
        { 'string.replace': { 'UID:[\\w-]+': 'UID:UID_STUB' } },
        { 'string.replace': { 'DTSTAMP:\\w+': 'DTSTAMP:DTSTAMP_STUB' } },
      ],
      expected: `BEGIN:VCALENDAR\r
VERSION:2.0\r
CALSCALE:GREGORIAN\r
PRODID:https://example.com\r
METHOD:PUBLISH\r
X-PUBLISHED-TTL:PT1H\r
BEGIN:VEVENT\r
UID:UID_STUB\r
SUMMARY:Happy new year!\r
DTSTAMP:DTSTAMP_STUB\r
DTSTART:20230101T000000Z\r
DTEND:20230102T000000Z\r
DESCRIPTION:Best wishes for 2023 🍾\r
URL:https://example.com\r
GEO:0;0\r
LOCATION:Earth\r
END:VEVENT\r
END:VCALENDAR\r
`,
    },
    'support end JavaScript date': {
      input: {
        date: new Date('2023-01-01T00:00:00Z'),
        endDate: new Date('2023-01-02T00:00:00Z'),
        title: 'Happy new year!',
        description: 'Best wishes for 2023 🍾',
        url: 'https://example.com',
        location: 'Earth',
        latlng: [0, 0],
      },
      mappers: [
        {
          ics: {
            start: { prop: 'date' },
            title: { prop: 'title' },
            description: { prop: 'description' },
            end: { prop: 'endDate' },
            url: { prop: 'url' },
            location: { prop: 'location' },
            coordinates: { prop: 'latlng' },
          },
        },
        { 'string.replace': { 'UID:[\\w-]+': 'UID:UID_STUB' } },
        { 'string.replace': { 'DTSTAMP:\\w+': 'DTSTAMP:DTSTAMP_STUB' } },
      ],
      expected: `BEGIN:VCALENDAR\r
VERSION:2.0\r
CALSCALE:GREGORIAN\r
PRODID:https://example.com\r
METHOD:PUBLISH\r
X-PUBLISHED-TTL:PT1H\r
BEGIN:VEVENT\r
UID:UID_STUB\r
SUMMARY:Happy new year!\r
DTSTAMP:DTSTAMP_STUB\r
DTSTART:20230101T000000Z\r
DTEND:20230102T000000Z\r
DESCRIPTION:Best wishes for 2023 🍾\r
URL:https://example.com\r
GEO:0;0\r
LOCATION:Earth\r
END:VEVENT\r
END:VCALENDAR\r
`,
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

describe('object.omit', () => {
  runTests({
    'omit properties from existing object': {
      input: { foo: 'foo', bar: 'bar', baz: 'baz' },
      mappers: {
        'object.omit': ['bar'],
      },
      expected: { foo: 'foo', baz: 'baz' },
    },
    'delete nested properties': {
      input: { foo: 1, bar: 'bar', baz: { test: 'foo', test2: 10 } },
      mappers: {
        'object.omit': ['bar', ['baz', 'test']],
      },
      expected: { foo: 1, baz: { test2: 10 } },
    },
    'handle non existing properties': {
      input: { foo: 1, bar: 'bar', baz: { test: 'foo', test2: 10 } },
      mappers: {
        'object.omit': ['bar', ['baz', '5']],
      },
      expected: { foo: 1, baz: { test: 'foo', test2: 10 } },
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

describe('array.unique', () => {
  runTests({
    'return the input if the input is not an array': {
      input: { a: 1, b: 2, c: 3 },
      mappers: [{ 'array.unique': null }],
      expected: { a: 1, b: 2, c: 3 },
    },
    'filter out duplicate values using primitive values without a remapper': {
      input: [1, 2, 2, 3],
      mappers: [{ 'array.unique': null }],
      expected: [1, 2, 3],
    },
    'filter out duplicate values using complex values without a remapper': {
      input: [
        { id: 1, value: 'one' },
        { id: 1, value: 'one' },
        { id: 1, value: 'one' },
        { id: 2, value: 'two' },
      ],
      mappers: [{ 'array.unique': null }],
      expected: [
        { id: 1, value: 'one' },
        { id: 2, value: 'two' },
      ],
    },
    'filter out duplicate values using complex values with a remapper': {
      input: [
        { id: 1, value: 'one' },
        { id: 1, value: 'one' },
        { id: 1, value: 'ONE' },
        { id: 2, value: 'two' },
      ],
      mappers: [{ 'array.unique': { prop: 'value' } }],
      expected: [
        { id: 1, value: 'one' },
        { id: 1, value: 'ONE' },
        { id: 2, value: 'two' },
      ],
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

describe('null.strip', () => {
  runTests({
    'strip null values': {
      input: { foo: null, bar: { baz: undefined }, fooz: [null, , undefined] },
      mappers: [{ 'null.strip': null }],
      expected: { bar: {}, fooz: [] },
    },
    'support depth': {
      input: { foo: null, bar: { baz: undefined }, fooz: [null, , undefined] },
      mappers: [{ 'null.strip': { depth: 1 } }],
      expected: { bar: { baz: undefined }, fooz: [null, , undefined] },
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
      mappers: { prop: ['address', 'town'] },
      expected: 'Bikini Bottom',
    },
    'get a property with a . in the key': {
      input: { 'address.town': 'Bikini Bottom' },
      mappers: { prop: 'address.town' },
      expected: 'Bikini Bottom',
    },
    'handle numbers': {
      input: { names: ['foo', 'bar'] },
      mappers: [{ prop: 'names' }, { prop: 0 }],
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

describe('random.choice', () => {
  it('should return random entries from a list', () => {
    const input = [1, 2, 3, 4];
    const result = remap({ 'random.choice': null }, input, null);
    expect(input).toContain(result);
  });

  runTests({
    'return the input if the input is not an array': {
      input: { input: [1, 2, 3, 4] },
      mappers: [{ 'random.choice': null }],
      expected: { input: [1, 2, 3, 4] },
    },
  });
});

describe('random.integer', () => {
  beforeEach(() => {
    import.meta.jest.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  runTests({
    'return the input if the input is not an array': {
      input: { input: undefined },
      mappers: [{ 'random.integer': [5, 10] }],
      expected: 7,
    },
  });
});

describe('random.float', () => {
  beforeEach(() => {
    import.meta.jest.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  runTests({
    'return the input if the input is not an array': {
      input: { input: undefined },
      mappers: [{ 'random.float': [5, 10] }],
      expected: 7.5,
    },
  });
});

describe('random.string', () => {
  beforeEach(() => {
    import.meta.jest
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.4)
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.6)
      .mockReturnValueOnce(0.7)
      .mockReturnValueOnce(0.8)
      .mockReturnValueOnce(0.2)
      .mockReturnValueOnce(0.3)
      .mockReturnValueOnce(0.4)
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.7)
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.6);
  });

  runTests({
    'return the input if the input is not an array': {
      input: { input: undefined },
      mappers: [{ 'random.string': { choice: 'abcdefghijklmnopqrstuvwzyx', length: 12 } }],
      expected: 'aknpsufhknszp',
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

describe('prior', () => {
  runTests({
    'return the first history item': {
      input: { input: 'data' },
      history: [{ old: 'monke' }, { latest: 'monke' }],
      mappers: [{ prop: 'input' }, { prior: 0 }],
      expected: { old: 'monke' },
    },
  });
});

describe('assign.prior', () => {
  runTests({
    'assign the second history item props defined in prop remappers to the output': {
      input: { input: 'data' },
      history: [{ old: 'monke' }, { rescue: 'monke', sadge: 'monke' }],
      mappers: [{ 'assign.prior': { index: 1, props: { happy: { prop: 'rescue' } } } }],
      expected: { input: 'data', happy: 'monke' },
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
