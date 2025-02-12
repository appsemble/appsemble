import {
  type AppConfigEntry,
  type AppMemberInfo,
  type AppMessages,
  type Remapper,
} from '@appsemble/types';
import { IntlMessageFormat } from 'intl-messageformat';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createExampleContext, examples } from './examples.js';
import { remap } from './remap.js';

/**
 * Stub the console types, since we don’t want to use dom or node types here.
 */
declare const console: {
  /**
   * Log an info message to the console.
   *
   * @param args The message to render to the console.
   */
  info: (...args: unknown[]) => void;

  /**
   * Log a warning message to the console.
   *
   * @param args The message to render to the console.
   */
  warn: (...args: unknown[]) => void;

  /**
   * Log an error message to the console.
   *
   * @param args The message to render to the console.
   */
  error: (...args: unknown[]) => void;
};

interface TestCase {
  input: any;
  mappers: Remapper;
  expected: any;
  messages?: AppMessages['messages'];
  variables?: AppConfigEntry[];
  appMemberInfo?: AppMemberInfo;
  context?: Record<string, any>;
  history?: unknown[];
}

function runTests(tests: Record<string, TestCase>): void {
  it.each(Object.entries(tests))(
    'should %s',
    (name, { appMemberInfo, context, expected, history, input, mappers, messages, variables }) => {
      const result = remap(mappers, input, {
        getMessage: ({ defaultMessage, id }) =>
          new IntlMessageFormat(messages?.messageIds?.[id] ?? defaultMessage),
        getVariable: (variableName) =>
          variables.find((variable) => variable.name === variableName)?.value,
        url: 'https://example.com/en/example',
        appUrl: 'https://example.com',
        context,
        history,
        appId: 6789,
        locale: 'en',
        pageData: { hello: 'Page data' },
        appMemberInfo,
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

describe('Nested arrays', () => {
  runTests({
    'flatten remappers': {
      input: { value: 123 },
      mappers: [[[[[{ prop: 'value' }]]]]],
      expected: 123,
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

describe('variable', () => {
  runTests({
    'get a variable': {
      input: {},
      mappers: { variable: 'my-variable' },
      expected: 'my-variable-value',
      variables: [{ id: 0, name: 'my-variable', value: 'my-variable-value' }],
    },
    'get an undefined variable': {
      input: {},
      mappers: { variable: 'my-variable' },
      expected: undefined,
      variables: [],
    },
  });
});

describe('number.parse', () => {
  runTests({
    'return the parsed number': {
      input: '42',
      mappers: { 'number.parse': null },
      expected: 42,
    },
    'return the parsed decimal number': {
      input: '42.5',
      mappers: { 'number.parse': null },
      expected: 42.5,
    },
    'return 0 if there is no input': {
      input: null,
      mappers: { 'number.parse': null },
      expected: 0,
    },
    'return the input if it can not be converted': {
      input: 'test',
      mappers: { 'number.parse': null },
      expected: 'test',
    },
    'return the parsed integer from a remapper': {
      input: { number: '42' },
      mappers: { 'number.parse': { prop: 'number' } },
      expected: 42,
    },
    'return the parsed decimal from a remapper': {
      input: { number: '42.5' },
      mappers: { 'number.parse': { prop: 'number' } },
      expected: 42.5,
    },
    'return 0 if the remapped value is null': {
      input: { number: null },
      mappers: { 'number.parse': { prop: 'number' } },
      expected: 0,
    },
    'return the remapped value if it can not be parsed': {
      input: { number: 'test' },
      mappers: { 'number.parse': { prop: 'number' } },
      expected: 'test',
    },
  });
});

describe('date.now', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: 0 });
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
    vi.useFakeTimers({ now: 0 });
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

describe('date.format', () => {
  runTests({
    'format date objects': {
      input: new Date('2020-01-02T03:04:05Z'),
      mappers: { 'date.format': null },
      expected: '2020-01-02T03:04:05.000Z',
    },
    'format date strings': {
      input: '2020-01-02T03:04:05Z',
      mappers: { 'date.format': null },
      expected: '2020-01-02T03:04:05.000Z',
    },
    'format unix timestamps': {
      input: 0,
      mappers: { 'date.format': null },
      expected: '1970-01-01T00:00:00.000Z',
    },
    'format date objects to custom format': {
      input: new Date('2020-01-02T03:04:05Z'),
      mappers: { 'date.format': 'dd-MM-yyyy' },
      expected: '02-01-2020',
    },
    'format date strings to custom format': {
      input: '2020-01-02T03:04:05Z',
      mappers: { 'date.format': 'yyyy-MM-dd' },
      expected: '2020-01-02',
    },
    'format unix timestamps to custom format': {
      input: 0,
      mappers: { 'date.format': 'MM/dd/yyyy' },
      expected: '01/01/1970',
    },
  });
});

describe('log', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(null);
    vi.spyOn(console, 'info').mockImplementation(null);
    vi.spyOn(console, 'warn').mockImplementation(null);
  });

  function runLogTests(tests: Record<string, TestCase>): void {
    it.each(Object.entries(tests))(
      'should %s',
      (
        name,
        {
          appMemberInfo,
          context,
          expected: expectedInput,
          history,
          input,
          mappers,
          messages,
          variables,
        },
      ) => {
        const expected = JSON.stringify(
          {
            input: expectedInput,
            context: {
              root: {
                message: 'hi mom!',
              },
              url: 'https://example.com/en/example',
              appUrl: 'https://example.com',
              appId: 6789,
              locale: 'en',
              pageData: {
                hello: 'Page data',
              },
            },
          },
          null,
          2,
        );
        remap(mappers, input, {
          getMessage: ({ defaultMessage, id }) =>
            new IntlMessageFormat(messages?.messageIds?.[id] ?? defaultMessage),
          getVariable: (variableName) =>
            variables.find((variable) => variable.name === variableName).value,
          url: 'https://example.com/en/example',
          appUrl: 'https://example.com',
          context,
          history,
          appId: 6789,
          locale: 'en',
          pageData: { hello: 'Page data' },
          appMemberInfo,
        });
        expect(console[(mappers as { log: 'error' | 'info' | 'warn' }).log]).toHaveBeenCalledWith(
          expected,
        );
      },
    );
  }

  runLogTests({
    'log `hi mom!` with log level `info`': {
      input: { message: 'hi mom!' },
      mappers: { log: 'info' },
      expected: { message: 'hi mom!' },
    },
    'log `hi mom!` with log level `warn`': {
      input: { message: 'hi mom!' },
      mappers: { log: 'warn' },
      expected: { message: 'hi mom!' },
    },
    'log `hi mom!` with log level `error`': {
      input: { message: 'hi mom!' },
      mappers: { log: 'error' },
      expected: { message: 'hi mom!' },
    },
  });
  runTests({
    'return input': {
      input: 'input',
      mappers: { log: 'info' },
      expected: 'input',
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

describe('not', () => {
  runTests({
    'return false if any of the values are equal to the first': {
      input: [1, 2, 1],
      mappers: { not: [{ prop: '0' }, { prop: '1' }, { prop: '2' }] },
      expected: false,
    },
    'use deep equality': {
      input: [{ foo: { bar: 3 } }, { foo: { bar: 3 } }],
      mappers: { not: [{ prop: '0' }, { prop: '1' }] },
      expected: false,
    },
    'return true if all values are not equal to the first': {
      input: [{ foo: { bar: 3 } }, { foo: { bar: 2 } }, { foo: { bar: 2 } }],
      mappers: { not: [{ prop: '0' }, { prop: '1' }] },
      expected: true,
    },
    'return true if (computed) input is false': {
      input: false,
      mappers: { not: [{ root: null }] },
      expected: true,
    },
    'return false if (computed) input is true': {
      input: true,
      mappers: { not: [{ root: null }] },
      expected: false,
    },
    'return true when mappers is empty': {
      input: true,
      mappers: { not: [] },
      expected: true,
    },
  });
});

describe('and', () => {
  runTests({
    'return false if any of the values are equal to false': {
      input: [true, true, false],
      mappers: { and: [{ prop: '0' }, { prop: '1' }, { prop: '2' }] },
      expected: false,
    },
    'return true if all values are true': {
      input: [true, true, true],
      mappers: { and: [{ prop: '0' }, { prop: '1' }, { prop: '2' }] },
      expected: true,
    },
    'return false if all values are false': {
      input: [false, false, false],
      mappers: { and: [{ prop: '0' }, { prop: '1' }, { prop: '2' }] },
      expected: false,
    },
    'use deep equality': {
      input: [{ foo: { bar: true } }, { foo: { bar: true } }],
      mappers: { and: [{ prop: '0' }, { prop: '1' }] },
      expected: true,
    },
    'return false if (computed) input is false': {
      input: false,
      mappers: { and: [{ root: null }] },
      expected: false,
    },
    'return true if (computed) input is true': {
      input: true,
      mappers: { and: [{ root: null }] },
      expected: true,
    },
    'return true if input is a truty value': {
      input: 'string',
      mappers: { and: [{ root: null }] },
      expected: true,
    },
    'return true if input is truthy values': {
      input: ['string', 'string2'],
      mappers: { and: [{ prop: '0' }, { prop: '1' }] },
      expected: true,
    },
    'return true when mappers is empty': {
      input: true,
      mappers: { and: [] },
      expected: true,
    },
  });
});

describe('or', () => {
  runTests({
    'return true if any of the values are equal to true': {
      input: [false, true, false],
      mappers: { or: [{ prop: '0' }, { prop: '1' }, { prop: '2' }] },
      expected: true,
    },
    'return false if all values are false': {
      input: [false, false, false],
      mappers: { or: [{ prop: '0' }, { prop: '1' }, { prop: '2' }] },
      expected: false,
    },
    'return true if all values are true': {
      input: [true, true, true],
      mappers: { or: [{ prop: '0' }, { prop: '1' }, { prop: '2' }] },
      expected: true,
    },
    'use deep equality': {
      input: [{ foo: { bar: true } }, { foo: { bar: false } }],
      mappers: { or: [{ prop: '0' }, { prop: '1' }] },
      expected: true,
    },
    'return false if (computed) input is false': {
      input: false,
      mappers: { or: [{ root: null }] },
      expected: false,
    },
    'return true if (computed) input is true': {
      input: true,
      mappers: { or: [{ root: null }] },
      expected: true,
    },
    'return true if imput is one truthy value': {
      input: 'string',
      mappers: { or: [{ root: null }] },
      expected: true,
    },
    'return true if input contains a truty value': {
      input: ['string', false],
      mappers: { or: [{ prop: 0 }, { prop: 1 }] },
      expected: true,
    },
    'return true when mappers is empty': {
      input: true,
      mappers: { or: [] },
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

describe('match', () => {
  runTests({
    'return the value of the first case if case is truthy': {
      input: {},
      mappers: {
        match: [
          { case: true, value: 'case 1' },
          { case: true, value: 'case 2' },
          { case: true, value: 'case 3' },
        ],
      },
      expected: 'case 1',
    },
  });
  runTests({
    'return the value of the second case if case 1 is falsy and 2 is truthy': {
      input: {},
      mappers: {
        match: [
          { case: false, value: 'case 1' },
          { case: true, value: 'case 2' },
          { case: false, value: 'case 3' },
        ],
      },
      expected: 'case 2',
    },
  });
  runTests({
    'return null if all cases are falsy': {
      input: {},
      mappers: { match: [{ case: false, value: 'case 1' }] },
      expected: null,
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

describe('type', () => {
  runTests({
    'input array, type remapper test': {
      input: [
        { firstName: 'John', lastName: 'Doe' },
        { firstName: 'Jane', lastName: 'Smith' },
      ],
      mappers: { type: null },
      expected: 'array',
    },
    'input object, type remapper test': {
      input: { firstName: 'John', lastName: 'Doe' },
      mappers: { type: null },
      expected: 'object',
    },
    'input number, type remapper test': {
      input: 1,
      mappers: { type: null },
      expected: 'number',
    },
    'input string, type remapper test': {
      input: 'I am a string',
      mappers: { type: null },
      expected: 'string',
    },
    'null input type remapper test': {
      input: null,
      mappers: { type: null },
      expected: null,
    },
    'undefined input type remapper test': {
      input: undefined,
      mappers: { type: null },
      expected: 'undefined',
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

describe('array.flatten', () => {
  runTests({
    'with unspecified depth': {
      input: [
        'a',
        ['b'],
        ['c', 'd'],
        [
          ['e', 'f'],
          ['g', 'h'],
        ],
      ],
      mappers: [{ 'array.flatten': null }],
      expected: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
    },
    'with statically specified depth': {
      input: [
        'a',
        ['b'],
        ['c', 'd'],
        [
          ['e', 'f'],
          ['g', 'h'],
        ],
      ],
      mappers: [{ 'array.flatten': 1 }],
      expected: ['a', 'b', 'c', 'd', ['e', 'f'], ['g', 'h']],
    },
    'with dynamically specified depth': {
      input: [
        'a',
        ['b'],
        ['c', 'd'],
        [
          ['e', 'f'],
          ['g', 'h'],
        ],
      ],
      mappers: [{ 'array.flatten': { 'number.parse': '1' } }],
      expected: ['a', 'b', 'c', 'd', ['e', 'f'], ['g', 'h']],
    },
    'with non array input': {
      input: 'Oops',
      mappers: [{ 'array.flatten': null }],
      expected: 'Oops',
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
            item: [{ array: 'item' }],
          },
        },
      ],
      expected: { index: undefined, length: undefined, item: undefined },
    },
    'return the index, length and item if in the context of array.map': {
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
                item: [{ array: 'item' }],
              },
            },
          ],
        },
      ],
      expected: [
        { value: 'a', index: 0, length: 3, item: { value: 'a' } },
        { value: 'b', index: 1, length: 3, item: { value: 'b' } },
        { value: 'c', index: 2, length: 3, item: { value: 'c' } },
      ],
    },
  });
});

describe('array.filter', () => {
  runTests({
    'return a new array containing the object with specified value from array': {
      input: [{ name: 'Craig' }, { name: 'Joey' }, { name: 'Stuart' }],
      mappers: [{ 'array.filter': { equals: [{ prop: 'name' }, 'Craig'] } }],
      expected: [{ name: 'Craig' }],
    },
    'return a new array containing the 2 objects with specified value from array': {
      input: [{ name: 'Craig' }, { name: 'Joey' }, { name: 'Stuart' }, { name: 'Craig' }],
      mappers: [{ 'array.filter': { equals: [{ prop: 'name' }, 'Craig'] } }],
      expected: [{ name: 'Craig' }, { name: 'Craig' }],
    },
    'return a new array containing a single value when the array does not include objects': {
      input: ['Craig', 'Joey', 'Stuart'],
      mappers: [{ 'array.filter': { equals: [{ array: 'item' }, 'Craig'] } }],
      expected: ['Craig'],
    },
    'return an empty array when condition doesn’t match anything': {
      input: ['Craig', 'Joey', 'Stuart'],
      mappers: [{ 'array.filter': { equals: [{ array: 'item' }, 'Peter'] } }],
      expected: [],
    },
    'it should filter arrays with mixed content type(string)': {
      input: ['Craig', 5, 'Joey', 7, 'Stuart'],
      mappers: [{ 'array.filter': { equals: [{ array: 'item' }, 'Stuart'] } }],
      expected: ['Stuart'],
    },
    'it should filter arrays with mixed content type based on type of the item': {
      input: ['Craig', 5, 'Joey', 7, 'Stuart'],
      mappers: [{ 'array.filter': { equals: [[{ array: 'item' }, { type: null }], 'number'] } }],
      expected: [5, 7],
    },
  });
});

describe('array.find', () => {
  runTests({
    'return object with specified value from array': {
      input: [{ name: 'Craig' }, { name: 'Joey' }, { name: 'Stuart' }],
      mappers: [{ 'array.find': { equals: [{ prop: 'name' }, 'Craig'] } }],
      expected: { name: 'Craig' },
    },
    'return undefined when condition doesn’t match anything': {
      input: [{ name: 'Craig' }],
      mappers: [{ 'array.find': { equals: [{ prop: 'name' }, 'foo'] } }],
      expected: null,
    },
    'return single value when the array does not include objects': {
      input: ['Craig', 'Stuart'],
      mappers: [{ 'array.find': 'Craig' }],
      expected: 'Craig',
    },
  });
});

describe('array.from', () => {
  runTests({
    'create new array with remapped values': {
      input: { foo: 'bar' },
      mappers: [{ 'array.from': [{ 'object.from': { foo: { prop: 'foo' } } }, 'baz'] }],
      expected: [{ foo: 'bar' }, 'baz'],
    },
    'create empty array': {
      input: { foo: 'bar' },
      mappers: [{ 'array.from': [] }],
      expected: [],
    },
  });
});

describe('array.append', () => {
  runTests({
    'append remapped value to array': {
      input: ['baz'],
      mappers: [{ 'array.append': [{ 'object.from': { foo: 'bar' } }] }],
      expected: ['baz', { foo: 'bar' }],
    },
    'create empty array': {
      input: { foo: 'bar' },
      mappers: [{ 'array.append': [] }],
      expected: [],
    },
  });
});

describe('array.omit', () => {
  runTests({
    'omit objects at given remapped indices': {
      input: [{ foo: '...' }, { bar: '...' }, { baz: '...' }],
      mappers: [{ 'array.omit': [0, { context: 'index' }] }],
      expected: [{ bar: '...' }],
      context: { index: 2 },
    },
    'omit nothing': {
      input: [{ foo: '...' }, { bar: '...' }, { baz: '...' }],
      mappers: [{ 'array.omit': [{ static: 'index' }] }],
      expected: [{ foo: '...' }, { bar: '...' }, { baz: '...' }],
    },
    'create empty array': {
      input: { foo: 'bar' },
      mappers: [{ 'array.omit': [] }],
      expected: [],
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
    'handle a single remapper': {
      input: { en: 'English', nl: 'Dutch' },
      mappers: [{ prop: { app: 'locale' } }],
      expected: 'English',
    },
    'handle an array of remappers': {
      input: { address: { town: 'Bikini Bottom' } },
      mappers: [{ prop: [{ 'object.from': { prop: 'address' } }, { prop: 'prop' }] }],
      expected: { town: 'Bikini Bottom' },
    },
    'handle an array of remappers with numbers': {
      input: { languages: ['English', 'Dutch'] },
      mappers: [
        { prop: [{ 'object.from': { prop: 'languages' } }, { prop: 'prop' }] },
        { prop: 0 },
      ],
      expected: 'English',
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
    'handle array input': {
      input: ['one', 'two', 'three', 'four'],
      mappers: { prop: 1 },
      expected: 'two',
    },
    'handle array input and negative index': {
      input: ['one', 'two', 'three', 'four'],
      mappers: { prop: -3 },
      expected: 'two',
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
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
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
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
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
    vi.spyOn(Math, 'random')
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

describe('length', () => {
  runTests({
    'return the length of input array': {
      input: [1, 2, 3, 4, 5],
      mappers: [{ len: null }],
      expected: 5,
    },
    'return undefined if the input is not an array or a string': {
      input: { hello: 'world' },
      mappers: [{ len: null }],
      expected: undefined,
    },
    'return the length of input string': {
      input: 'foo',
      mappers: [{ len: null }],
      expected: 3,
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

describe('history', () => {
  runTests({
    'return the first history item': {
      input: { input: 'data' },
      history: [{ old: 'monke' }, { latest: 'monke' }],
      mappers: [{ prop: 'input' }, { history: 0 }],
      expected: { old: 'monke' },
    },
  });
});

describe('from.history', () => {
  runTests({
    'create new object with props from the second history item': {
      input: { input: 'data' },
      history: [{ old: 'monke' }, { rescue: 'monke', sadge: 'monke' }],
      mappers: [{ 'from.history': { index: 1, props: { happy: { prop: 'rescue' } } } }],
      expected: { happy: 'monke' },
    },
  });
});

describe('assign.history', () => {
  runTests({
    'assign the second history item props defined in prop remappers to the output': {
      input: { input: 'data' },
      history: [{ old: 'monke' }, { rescue: 'monke', sadge: 'monke' }],
      mappers: [{ 'assign.history': { index: 1, props: { happy: { prop: 'rescue' } } } }],
      expected: { input: 'data', happy: 'monke' },
    },
  });
});

describe('omit.history', () => {
  runTests({
    'assign the second history item props to the output except omitted props': {
      input: { input: 'data' },
      history: [{ old: 'monke' }, { rescue: 'monke', sadge: 'monke' }],
      mappers: [{ 'omit.history': { index: 1, keys: ['sadge'] } }],
      expected: { input: 'data', rescue: 'monke' },
    },
    'not assign nested omitted props': {
      input: { input: 'data' },
      history: [{ rescue: 'monke', nested: { sadge: 'monke', safe: 'monke' } }],
      mappers: [{ 'omit.history': { index: 0, keys: [['nested', 'sadge']] } }],
      expected: { input: 'data', rescue: 'monke', nested: { safe: 'monke' } },
    },
    'handle non existing properties': {
      input: { input: 'data' },
      history: [{ rescue: 'monke', nested: { happy: 'monke', safe: 'monke' } }],
      mappers: [{ 'omit.history': { index: 0, keys: [['nested', 'nonexistent']] } }],
      expected: { input: 'data', rescue: 'monke', nested: { happy: 'monke', safe: 'monke' } },
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

describe('string.startsWith', () => {
  runTests({
    'should return true': {
      input: 'Random string here',
      mappers: { 'string.startsWith': 'Random' },
      expected: true,
    },
    'should do case sensitive matching by default': {
      input: 'Random string here',
      mappers: {
        'string.startsWith': 'random',
      },
      expected: false,
    },
    'should support disabling the strict case checks': {
      input: 'Random string here',
      mappers: {
        'string.startsWith': {
          substring: 'random',
          strict: false,
        },
      },
      expected: true,
    },
    'should return false': {
      input: 'Random string here',
      mappers: {
        'string.startsWith': 'Not here',
      },
      expected: false,
    },
  });
});

describe('string.endsWith', () => {
  runTests({
    'should return true': {
      input: 'Random string here',
      mappers: { 'string.endsWith': 'here' },
      expected: true,
    },
    'should do case sensitive matching by default': {
      input: 'Random string here',
      mappers: {
        'string.endsWith': 'Here',
      },
      expected: false,
    },
    'should support disabling the strict case checks': {
      input: 'Random string here',
      mappers: {
        'string.endsWith': {
          substring: 'Here',
          strict: false,
        },
      },
      expected: true,
    },
    'should return false': {
      input: 'Random string here',
      mappers: { 'string.endsWith': 'Not here' },
      expected: false,
    },
  });
});

describe('string.slice', () => {
  runTests({
    'should support number as remapper input': {
      input: 'lazy crazy fox, fix my pipeline',
      mappers: { 'string.slice': 5 },
      expected: 'crazy fox, fix my pipeline',
    },
  });
  runTests({
    'should support numbers array as remapper input': {
      input: 'lazy crazy fox, fix my pipeline',
      mappers: { 'string.slice': [5, 10] },
      expected: 'crazy',
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
      mappers: { 'app.member': 'name' },
      expected: 'Me',
      appMemberInfo: {
        sub: '1',
        name: 'Me',
        email: 'me@example.com',
        email_verified: true,
        picture: '',
        role: 'Member',
        demo: false,
      },
    },
  });
});

describe.each(Object.entries(examples))(
  'should test remapper example: %s',
  (name, { input, remapper, result: expected, skip }) => {
    it.skipIf(skip)('to be valid.', () => {
      const context = createExampleContext(new URL('https://example.com'), 'en');
      const result = remap(remapper as Remapper, input, context);
      expect(result).toStrictEqual(expected);
    });
  },
);
