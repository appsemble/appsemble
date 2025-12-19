import { IntlMessageFormat } from 'intl-messageformat';
import { stringify } from 'yaml';

import { type RemapperContext } from './remap.js';
import { type AppMemberInfo, PredefinedAppRole, type Remappers } from './types/index.js';

export interface RemapperExample {
  input: unknown;
  remapper: unknown;
  result: unknown;
  history?: unknown[];
  skip?: boolean;
}

type CustomRemapperKeys =
  | 'app.id'
  | 'app.locale'
  | 'app.url'
  | 'array.map.1'
  | 'array.range.1'
  | 'array.range.map'
  | 'array.range'
  | 'date.endOf.quarter'
  | 'date.endOf.week'
  | 'date.endOf.weekSun'
  | 'date.endOf.year'
  | 'date.endOf'
  | 'date.set'
  | 'date.startOf.quarter'
  | 'date.startOf.week'
  | 'date.startOf.weekSun'
  | 'date.startOf.year'
  | 'date.startOf'
  | 'if.else'
  | 'if.then'
  | 'None';
export type RemapperExampleKeys = CustomRemapperKeys | Exclude<keyof Remappers, 'app' | 'if'>;

export const examples: Record<RemapperExampleKeys, RemapperExample> = {
  None: {
    input: null,
    remapper: '',
    result: '',
  },
  'app.id': {
    input: null,
    remapper: {
      app: 'id',
    },
    result: 0,
  },
  'app.locale': {
    input: null,
    remapper: {
      app: 'locale',
    },
    result: 'en',
  },
  'app.url': {
    input: null,
    remapper: {
      app: 'url',
    },
    result: 'https://example-app.example-organization.example.com',
  },
  'app.member': {
    input: null,
    remapper: {},
    result: {},
    skip: true,
  },
  group: {
    input: null,
    remapper: {
      group: 'name',
    },
    result: 'test-group',
  },
  type: {
    input: [1, 2, 3],
    remapper: { type: null },
    result: 'array',
  },
  array: {
    input: ['a', 'b', 'c'],
    remapper: {
      'array.map': {
        'object.from': {
          index: {
            array: 'index',
          },
          length: {
            array: 'length',
          },
          item: {
            array: 'item',
          },
          prevItem: {
            array: 'prevItem',
          },
          nextItem: {
            array: 'nextItem',
          },
        },
      },
    },
    result: [
      {
        index: 0,
        length: 3,
        item: 'a',
        prevItem: undefined,
        nextItem: 'b',
      },
      {
        index: 1,
        length: 3,
        item: 'b',
        prevItem: 'a',
        nextItem: 'c',
      },
      {
        index: 2,
        length: 3,
        item: 'c',
        prevItem: 'b',
        nextItem: undefined,
      },
    ],
  },
  'array.contains': {
    input: [1, 2, 3, 4, 5],
    remapper: { 'array.contains': { static: 6 } },
    result: false,
  },
  'string.contains': {
    input: 'Input string',
    remapper: { 'string.contains': 'string' },
    result: true,
  },
  len: {
    input: 'string',
    remapper: { len: null },
    result: 6,
  },
  'array.append': {
    input: [
      {
        name: 'Peter',
        occupation: 'Delivery driver',
      },
      {
        name: 'Otto',
        occupation: 'Scientist',
      },
      {
        name: 'Harry',
        occupation: 'CEO',
      },
    ],
    remapper: {
      'array.append': [
        {
          'object.from': {
            name: 'James',
            occupation: 'News reporter',
          },
        },
      ],
    },
    result: [
      {
        name: 'Peter',
        occupation: 'Delivery driver',
      },
      {
        name: 'Otto',
        occupation: 'Scientist',
      },
      {
        name: 'Harry',
        occupation: 'CEO',
      },
      {
        name: 'James',
        occupation: 'News reporter',
      },
    ],
  },
  'array.filter': {
    input: [
      {
        name: 'Peter',
      },
      {
        name: 'Louis',
      },
      {
        name: 'Brian',
      },
    ],
    remapper: {
      'array.filter': {
        equals: [
          {
            prop: 'name',
          },
          'Louis',
        ],
      },
    },
    result: [{ name: 'Louis' }],
  },
  'array.find': {
    input: [
      {
        name: 'Craig',
      },
      {
        name: 'Joey',
      },
      {
        name: 'Stuart',
      },
    ],
    remapper: {
      'array.find': {
        equals: [
          {
            prop: 'name',
          },
          'Craig',
        ],
      },
    },
    result: {
      name: 'Craig',
    },
  },
  'array.from': {
    input: null,
    remapper: {
      'array.from': ['Peter', 'Otto', 'Harry'],
    },
    result: ['Peter', 'Otto', 'Harry'],
  },
  'array.join': {
    input: ["id eq '5'", "id eq '6'", "id eq '7'"],
    remapper: {
      'array.join': ' or ',
    },
    result: "id eq '5' or id eq '6' or id eq '7'",
  },
  'array.groupBy': {
    input: [
      { name: 'Alice', department: 'Engineering' },
      { name: 'Bob', department: 'Sales' },
      { name: 'Charlie', department: 'Engineering' },
    ],
    remapper: {
      'array.groupBy': 'department',
    },
    result: [
      {
        key: 'Engineering',
        items: [
          { name: 'Alice', department: 'Engineering' },
          { name: 'Charlie', department: 'Engineering' },
        ],
      },
      {
        key: 'Sales',
        items: [{ name: 'Bob', department: 'Sales' }],
      },
    ],
  },
  'array.toObject': {
    input: [
      { key: 'Engineering', items: ['Alice', 'Charlie'] },
      { key: 'Sales', items: ['Bob'] },
    ],
    remapper: {
      'array.toObject': { key: { prop: 'key' }, value: { prop: 'items' } },
    },
    result: {
      Engineering: ['Alice', 'Charlie'],
      Sales: ['Bob'],
    },
  },
  'array.map': {
    input: [
      {
        name: 'Peter',
        occupation: 'Delivery driver',
      },
      {
        name: 'Otto',
        occupation: 'Scientist',
      },
      {
        name: 'Harry',
        occupation: 'CEO',
      },
    ],
    remapper: {
      'array.map': {
        'object.omit': ['name'],
      },
    },
    result: [
      {
        occupation: 'Delivery driver',
      },
      {
        occupation: 'Scientist',
      },
      {
        occupation: 'CEO',
      },
    ],
  },
  'array.map.1': {
    input: [
      {
        name: 'Peter',
        occupation: 'Delivery driver',
      },
      {
        name: 'Otto',
        occupation: 'Scientist',
      },
      {
        name: 'Harry',
        occupation: 'CEO',
      },
    ],
    remapper: [
      {
        'array.map': {
          if: {
            condition: {
              equals: [
                {
                  prop: 'occupation',
                },
                'Scientist',
              ],
            },
            else: null,
            then: {
              'object.from': {
                name: {
                  prop: 'name',
                },
                occupation: {
                  prop: 'occupation',
                },
              },
            },
          },
        },
      },
      {
        'null.strip': null,
      },
    ],
    result: [
      {
        name: 'Otto',
        occupation: 'Scientist',
      },
    ],
  },
  'array.range': {
    input: null,
    remapper: {
      'array.range': 4,
    },
    result: [0, 1, 2, 3],
  },
  'array.range.1': {
    input: 5,
    remapper: {
      'array.range': { root: null },
    },
    result: [0, 1, 2, 3, 4],
  },
  'array.range.map': {
    input: 3,
    remapper: [
      { 'array.range': { root: null } },
      {
        'array.map': {
          'object.from': {
            index: { array: 'item' },
            message: {
              'string.format': {
                template: 'Item {i}',
                values: { i: { array: 'item' } },
              },
            },
          },
        },
      },
    ],
    result: [
      { index: 0, message: 'Item 0' },
      { index: 1, message: 'Item 1' },
      { index: 2, message: 'Item 2' },
    ],
  },
  'array.omit': {
    input: [
      {
        name: 'Peter',
        occupation: 'Delivery driver',
      },
      {
        name: 'Otto',
        occupation: 'Scientist',
      },
      {
        name: 'Harry',
        occupation: 'CEO',
      },
      {
        name: 'James',
        occupation: 'News reporter',
      },
    ],
    remapper: {
      'array.omit': [3],
    },
    result: [
      {
        name: 'Peter',
        occupation: 'Delivery driver',
      },
      {
        name: 'Otto',
        occupation: 'Scientist',
      },
      {
        name: 'Harry',
        occupation: 'CEO',
      },
    ],
  },
  'array.unique': {
    input: [1, 1, 2, 3],
    remapper: {
      'array.unique': null,
    },
    result: [1, 2, 3],
  },
  'array.flatten': {
    input: [['Milka', 'Sven'], 'Goldie'],
    remapper: {
      'array.flatten': null,
    },
    result: ['Milka', 'Sven', 'Goldie'],
  },
  'assign.history': {
    input: null,
    remapper: {},
    result: {},
    skip: true,
  },
  context: {
    input: null,
    remapper: {},
    result: {},
    skip: true,
  },
  variable: {
    input: null,
    remapper: { variable: 'MY_VARIABLE' },
    result: 'variable value',
    skip: true,
  },
  'number.parse': {
    input: '42',
    remapper: { 'number.parse': null },
    result: 42,
    skip: true,
  },
  'date.add': {
    input: '2023-06-30T14:50:19.601Z',
    remapper: [
      {
        'date.now': null,
      },
      {
        'date.add': '1w',
      },
      {
        'date.format': null,
      },
    ],
    result: '2023-07-07T14:50:19.601Z',
    skip: true,
  },
  'date.format': {
    input: '2023-07-03',
    remapper: {
      'date.format': null,
    },
    result: '2023-07-02T22:00:00.000Z',
    skip: true,
  },
  'date.now': {
    input: null,
    remapper: {
      'date.now': null,
    },
    result: 'Mon Jul 03 2023 11:47:18 GMT+0200 (Midden-Europese zomertijd)',
    skip: true,
  },
  'date.parse': {
    input: '02/11/2014',
    remapper: {
      'date.parse': 'MM/dd/yyyy',
    },
    result: 'Tue Feb 11 2014 00:00:00',
    skip: true,
  },

  'date.startOf': {
    input: '2025-11-21T12:00:00.000Z',
    remapper: { 'date.startOf': 'month' },
    result: '2025-11-01T00:00:00.000Z',
    skip: true,
  },

  'date.startOf.year': {
    input: '2025-11-21T12:00:00.000Z',
    remapper: { 'date.startOf': 'year' },
    result: '2025-01-01T00:00:00.000Z',
    skip: true,
  },

  'date.startOf.quarter': {
    input: '2025-11-21T12:00:00.000Z',
    remapper: { 'date.startOf': 'quarter' },
    result: '2025-10-01T00:00:00.000Z',
    skip: true,
  },

  'date.startOf.week': {
    input: '2025-11-21T12:00:00.000Z',
    remapper: { 'date.startOf': 'week' },
    result: '2025-11-17T00:00:00.000Z',
    skip: true,
  },

  'date.startOf.weekSun': {
    input: '2025-11-21T12:00:00.000Z',
    remapper: { 'date.startOf': 'weekSun' },
    result: '2025-11-16T00:00:00.000Z',
    skip: true,
  },

  'date.endOf': {
    input: '2025-11-21T12:00:00.000Z',
    remapper: { 'date.endOf': 'month' },
    result: '2025-11-30T23:59:59.999Z',
    skip: true,
  },

  'date.endOf.year': {
    input: '2025-11-21T12:00:00.000Z',
    remapper: { 'date.endOf': 'year' },
    result: '2025-12-31T23:59:59.999Z',
    skip: true,
  },

  'date.endOf.quarter': {
    input: '2025-11-21T12:00:00.000Z',
    remapper: { 'date.endOf': 'quarter' },
    result: '2025-12-31T23:59:59.999Z',
    skip: true,
  },

  'date.endOf.week': {
    input: '2025-11-21T12:00:00.000Z',
    remapper: { 'date.endOf': 'week' },
    result: '2025-11-23T23:59:59.999Z',
    skip: true,
  },

  'date.endOf.weekSun': {
    input: '2025-11-21T12:00:00.000Z',
    remapper: { 'date.endOf': 'weekSun' },
    result: '2025-11-22T23:59:59.999Z',
    skip: true,
  },

  'date.set': {
    input: '2025-11-21T12:00:00.000Z',
    remapper: { 'date.set': { year: 2026, month: 1, day: 1 } },
    result: '2026-01-01T12:00:00.000Z',
  },

  equals: {
    input: { inputValue: 'example', expectedValue: 'example' },
    remapper: {
      equals: [{ prop: 'inputValue' }, { prop: 'expectedValue' }],
    },
    result: true,
  },
  'from.history': {
    input: null,
    remapper: {},
    result: {},
    skip: true,
  },
  gt: {
    input: { stock: 100 },
    remapper: { gt: [{ prop: 'stock' }, 5] },
    result: true,
  },
  history: {
    input: null,
    remapper: {},
    result: {},
    skip: true,
  },
  ics: {
    input: null,
    remapper: {},
    result: {},
    skip: true,
  },
  'if.then': {
    input: { guess: 4 },
    remapper: {
      if: {
        condition: {
          equals: [
            {
              prop: 'guess',
            },
            4,
          ],
        },
        then: {
          static: 'You guessed right!',
        },
        else: {
          static: 'You guessed wrong!',
        },
      },
    },
    result: 'You guessed right!',
  },
  'if.else': {
    input: { guess: 5 },
    remapper: {
      if: {
        condition: {
          equals: [
            {
              prop: 'guess',
            },
            4,
          ],
        },
        then: {
          static: 'You guessed right!',
        },
        else: {
          static: 'You guessed wrong!',
        },
      },
    },
    result: 'You guessed wrong!',
  },
  log: {
    input: null,
    remapper: {},
    result: {},
    skip: true,
  },
  lt: {
    input: { stock: 4 },
    remapper: { lt: [{ prop: 'stock' }, 5] },
    result: true,
  },
  match: {
    input: { Gem: 'Ruby' },
    remapper: {
      match: [
        {
          case: {
            equals: [
              {
                prop: 'Gem',
              },
              'Diamond',
            ],
          },
          value: 100,
        },
        {
          case: {
            equals: [
              {
                prop: 'Gem',
              },
              'Ruby',
            ],
          },
          value: 75,
        },
        {
          case: {
            equals: [
              {
                prop: 'Gem',
              },
              'Gold',
            ],
          },
          value: 50,
        },
        {
          case: {
            equals: [
              {
                prop: 'Gem',
              },
              'Sapphire',
            ],
          },
          value: 25,
          result: {},
        },
      ],
    },
    result: 75,
  },
  not: {
    input: { number: 3 },
    remapper: { not: [{ prop: 'number' }, 4] },
    result: true,
  },
  and: {
    input: { foo: true },
    remapper: { and: [{ prop: 'foo' }, true] },
    result: true,
  },
  or: {
    input: { foo: true },
    remapper: { or: [{ prop: 'foo' }, false] },
    result: true,
  },
  'null.strip': {
    input: null,
    remapper: {},
    result: {},
    skip: true,
  },
  'object.assign': {
    input: {
      title: 'Weekly fishing 21',
    },
    remapper: {
      'object.assign': {
        author: 'John Doe',
      },
    },
    result: {
      author: 'John Doe',
      title: 'Weekly fishing 21',
    },
  },
  'object.from': {
    input: null,
    remapper: {
      'object.from': {
        email: 'example@hotmail.com',
        username: 'Chris Taub',
      },
    },
    result: {
      email: 'example@hotmail.com',
      username: 'Chris Taub',
    },
  },
  'object.omit': {
    input: {
      author: 'John Doe',
      content: {
        interview: '...',
        introduction: 'This is the introduction for the new weekly fishing issue',
        paragraph1: '...',
      },
      title: 'Weekly fishing 21',
    },
    remapper: {
      'object.omit': ['author', ['content', 'interview']],
    },
    result: {
      content: {
        introduction: 'This is the introduction for the new weekly fishing issue',
        paragraph1: '...',
      },
      title: 'Weekly fishing 21',
    },
  },
  'object.compare': {
    input: { name: 'Alice' },
    remapper: {
      'object.compare': [
        {
          'object.from': {
            name: { prop: 'name' },
            age: 25,
            address: {
              'object.from': {
                city: 'Paris',
                zip: 7500,
              },
            },
            favoriteColors: {
              'array.from': ['blue', 'green'],
            },
          },
        },
        {
          'object.from': {
            name: 'Alice',
            age: 26,
            address: {
              'object.from': {
                city: 'Lyon',
                country: 'France',
              },
            },
            favoriteColors: { 'array.from': ['red', 'green', 'blue'] },
          },
        },
      ],
    },
    result: [
      { path: ['age'], type: 'changed', from: 25, to: 26 },
      {
        path: ['favoriteColors'],
        type: 'changed',
        from: ['blue', 'green'],
        to: ['red', 'green', 'blue'],
      },
      { path: ['address', 'city'], type: 'changed', from: 'Paris', to: 'Lyon' },
      { path: ['address', 'zip'], type: 'removed', value: 7500 },
      { path: ['address', 'country'], type: 'added', value: 'France' },
    ],
  },
  'object.explode': {
    input: {
      ownerName: 'John',
      country: 'USA',
      pets: [
        { name: 'Milka' },
        { name: 'Sven', country: 'Sweden' },
        { name: 'Tom', likes: ['mice', 'fish'] },
        { name: 'Jerry', looks: { color: 'brown' } },
      ],
    },
    remapper: {
      'object.explode': 'pets',
    },
    result: [
      { ownerName: 'John', name: 'Milka', country: 'USA' },
      { ownerName: 'John', name: 'Sven', country: 'Sweden' },
      { ownerName: 'John', name: 'Tom', country: 'USA', likes: ['mice', 'fish'] },
      { ownerName: 'John', name: 'Jerry', country: 'USA', looks: { color: 'brown' } },
    ],
  },
  'omit.history': {
    input: null,
    remapper: {},
    result: {},
    skip: true,
  },
  page: {
    input: null,
    remapper: {},
    result: {},
    skip: true,
  },
  prop: {
    input: {
      age: 52,
      name: 'John',
    },
    remapper: {
      prop: 'name',
    },
    result: 'John',
  },
  'random.choice': {
    input: null,
    remapper: {},
    result: {},
    skip: true,
  },
  'random.float': {
    input: null,
    remapper: {},
    result: {},
    skip: true,
  },
  'random.integer': {
    input: null,
    remapper: {},
    result: {},
    skip: true,
  },
  'random.string': {
    input: null,
    remapper: {},
    result: {},
    skip: true,
  },
  root: {
    input: 'input',
    remapper: { root: null },
    result: 'input',
  },
  static: {
    input: null,
    remapper: {
      static: 'Hello!',
    },
    result: 'Hello!',
  },
  step: {
    input: null,
    remapper: {},
    result: {},
    skip: true,
  },
  'tab.name': {
    input: null,
    remapper: {},
    result: {},
    skip: true,
  },
  'string.case': {
    input: 'Patrick',
    remapper: {
      'string.case': 'upper',
    },
    result: 'PATRICK',
  },
  'string.startsWith': {
    input: 'Random string here',
    remapper: {
      'string.startsWith': 'Random',
    },
    result: true,
  },
  'string.endsWith': {
    input: 'Random string here',
    remapper: {
      'string.endsWith': {
        substring: 'Here',
        strict: false,
      },
    },
    result: true,
  },
  slice: {
    input: 'Laziness',
    remapper: {
      slice: [3, 6],
    },
    result: 'ine',
  },

  'string.format': {
    input: {
      lotteryPrize: '5000',
    },
    remapper: {
      'string.format': {
        template: 'You have won €{lotteryAmount} in the lottery!!',
        values: {
          lotteryAmount: {
            prop: 'lotteryPrize',
          },
        },
      },
    },
    result: 'You have won €5000 in the lottery!!',
  },
  'string.replace': {
    input: 'Eindhoven is the best city in the Netherlands',
    remapper: {
      'string.replace': {
        '(best*)\\w+': 'cleanest',
      },
    },
    result: 'Eindhoven is the cleanest city in the Netherlands',
  },
  translate: {
    input: null,
    remapper: {},
    result: {},
    skip: true,
  },
  container: {
    input: null,
    remapper: {},
    result: {},
    skip: true,
  },
  'filter.from': {
    input: { exclude: 'Peter' },
    remapper: {
      'filter.from': {
        name: { type: 'String', comparator: 'ne', value: { prop: 'exclude' } },
        age: { type: 'Number', comparator: 'lt', value: 10 },
        height: { type: 'Number', comparator: 'le', value: 1.75 },
        heightString: { type: 'Number', comparator: 'le', value: '1.75' },
        birthday: { type: 'Date', comparator: 'ge', value: '2000-01-01' },
        friendsSince: { type: 'Date', comparator: 'ge', value: '2014-01-01T00:00:00Z' },
        job: { type: 'String', comparator: 'eq', value: null },
        employed: { type: 'Boolean', comparator: 'eq', value: false },
        id: { type: 'Guid', comparator: 'eq', value: '03a0a47b-e3a2-e311-9402-00155d104c24' },
        undefined: { type: 'String', comparator: 'eq', value: undefined },
        special: {
          type: 'String',
          comparator: 'eq',
          value: 'Special character\'s "test" \\%&+?^/',
        },
      },
    },
    result:
      "name ne 'Peter' and age lt 10 and height le 1.75 and heightString le 1.75 and birthday ge 2000-01-01 and friendsSince ge 2014-01-01T00:00:00Z and job eq null and employed eq false and id eq 03a0a47b-e3a2-e311-9402-00155d104c24 and undefined eq null and special eq 'Special character''s \"test\" \\\\%&+?^/'",
  },
  'order.from': {
    input: null,
    remapper: {
      'order.from': {
        name: 'asc',
        age: 'desc',
      },
    },
    result: 'name asc,age desc',
  },
  'xml.parse': {
    input: {
      xml: `
<obj>
  <foo>bar</foo>
  <item foo="bar">
    <item foo="bar">
      <text>text</text>
    </item>
  </item>
  <item bar="baz">
    <item bar="baz">
      <text>text 2</text>
    </item>
  </item>
  <item>
    <item foo="bar">
      <item foo="bar">
        <text>text</text>
      </item>
    </item>
    <item bar="baz">
      <item bar="baz">
        <text>text 2</text>
      </item>
    </item>
  </item>
</obj>
`,
    },
    remapper: { 'xml.parse': { prop: 'xml' } },
    result: {
      obj: {
        foo: 'bar',
        item: [
          {
            foo: 'bar',
            item: { foo: 'bar', text: 'text' },
          },
          {
            bar: 'baz',
            item: { bar: 'baz', text: 'text 2' },
          },
          {
            item: [
              {
                foo: 'bar',
                item: { foo: 'bar', text: 'text' },
              },
              {
                bar: 'baz',
                item: { bar: 'baz', text: 'text 2' },
              },
            ],
          },
        ],
      },
    },
  },
  defined: {
    input: [0, '', false, undefined, null],
    remapper: {
      'array.map': {
        defined: { array: 'item' },
      },
    },
    result: [true, true, true, false, false],
  },
  focus: {
    input: null,
    history: [
      [
        { id: 'customer1', name: 'Customer 1' },
        { id: 'customer2', name: 'Customer 2' },
        { id: 'customer3', name: 'Customer 3' },
      ],
      [
        { id: 'orderA', customerId: 'customer1', value: 'Order A for Customer 1' },
        { id: 'orderB', customerId: 'customer2', value: 'Order B for Customer 2' },
        { id: 'orderC', customerId: 'customer1', value: 'Order C for Customer 1' },
        { id: 'orderD', customerId: 'customer3', value: 'Order D for Customer 3' },
        { id: 'orderE', customerId: 'customer1', value: 'Order E for Customer 1' },
        { id: 'orderF', customerId: 'customer2', value: 'Order F for Customer 2' },
      ],
    ],
    remapper: [
      { history: 0 },
      {
        'array.map': {
          focus: {
            on: {
              'object.from': {
                currentCustomer: { array: 'item' },
                allOrders: { history: 1 },
              },
            },
            do: {
              'object.from': {
                id: { prop: 'id' },
                name: { prop: 'name' },
                associatedOrders: [
                  { root: null },
                  { prop: 'allOrders' },
                  {
                    'array.filter': {
                      equals: [
                        { prop: 'customerId' },
                        [{ root: null }, { prop: 'currentCustomer' }, { prop: 'id' }],
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
    ],
    result: [
      {
        id: 'customer1',
        name: 'Customer 1',
        associatedOrders: [
          { id: 'orderA', customerId: 'customer1', value: 'Order A for Customer 1' },
          { id: 'orderC', customerId: 'customer1', value: 'Order C for Customer 1' },
          { id: 'orderE', customerId: 'customer1', value: 'Order E for Customer 1' },
        ],
      },
      {
        id: 'customer2',
        name: 'Customer 2',
        associatedOrders: [
          { id: 'orderB', customerId: 'customer2', value: 'Order B for Customer 2' },
          { id: 'orderF', customerId: 'customer2', value: 'Order F for Customer 2' },
        ],
      },
      {
        id: 'customer3',
        name: 'Customer 3',
        associatedOrders: [
          { id: 'orderD', customerId: 'customer3', value: 'Order D for Customer 3' },
        ],
      },
    ],
  },
  maths: {
    input: { version: 0 },
    remapper: {
      maths: {
        a: { prop: 'version' },
        b: { static: 1 },
        operation: 'add',
      },
    },
    result: 1,
  },
} as const;

/**
 * @param remapper The remapper example to use.
 * @param options The options specifying how to display the example.
 * @returns Example based on the input options.
 */
export function schemaExample(
  remapper: keyof typeof examples,
  options?: {
    input?: 'inline' | 'pretty';
    result?: 'inline' | 'pretty';
    exclude?: ('input' | 'remapper' | 'result')[];
  },
): string {
  const { exclude = [], input = 'inline', result } = options ?? {};
  let example = '';

  if (!exclude.includes('input')) {
    const spacing = input === 'pretty' && 2;
    example += `Input:\n\n\`\`\`json\n${JSON.stringify(examples[remapper].input, null, spacing || undefined)}\n\`\`\`\n`;
  }

  if (!exclude.includes('remapper')) {
    example += `\`\`\`yaml\n${stringify(examples[remapper].remapper)}\n\`\`\`\n`;
  }

  if (!exclude.includes('result')) {
    const spacing = result === 'pretty' && 2;
    example += `Result:\n\n\`\`\`json\n${JSON.stringify(examples[remapper].result, null, spacing || undefined)}\n\`\`\`\n`;
  }

  return example;
}

export function createExampleContext(
  url: URL,
  lang: string,
  userInfo?: AppMemberInfo,
  history?: unknown[],
): RemapperContext {
  return {
    getMessage: ({ defaultMessage }) =>
      new IntlMessageFormat(defaultMessage ?? [], lang, undefined),
    getVariable: (name) => (name === 'MY_VARIABLE' ? 'variable value' : undefined),
    url: String(url),
    appUrl: `${url.protocol}//example-app.example-organization.${url.host}`,
    context: {},
    history: history ?? ['Default example value'],
    appId: 0,
    locale: 'en',
    pageData: { default: 'Page data' },
    appMemberInfo: {
      sub: 'default-example-id',
      email: 'default-app-member@example.com',
      email_verified: true,
      name: 'default-example-name',
      demo: false,
      role: 'Member',
      zoneinfo: 'Europe/Amsterdam',
      properties: {
        completedExamples: [],
      },
      $seed: false,
      $ephemeral: false,
    },
    group: {
      id: 0,
      name: 'test-group',
      role: PredefinedAppRole.Member,
    },
  };
}
