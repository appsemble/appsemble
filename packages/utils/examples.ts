import { type Remappers, type UserInfo } from '@appsemble/types';
import { IntlMessageFormat } from 'intl-messageformat';
import { stringify } from 'yaml';

import { type RemapperContext } from './remap.js';

export interface RemapperExample {
  input: unknown;
  remapper: unknown;
  result: unknown;
  skip?: boolean;
}

type CustomRemapperKeys =
  | 'app.id'
  | 'app.locale'
  | 'app.url'
  | 'array.map.1'
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
        },
      },
    },
    result: [
      {
        index: 0,
        length: 3,
        item: 'a',
      },
      {
        index: 1,
        length: 3,
        item: 'b',
      },
      {
        index: 2,
        length: 3,
        item: 'c',
      },
    ],
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
  defined: {
    input: [0, '', false, undefined, null],
    remapper: {
      'array.map': {
        defined: { array: 'item' },
      },
    },
    result: [true, true, true, false, false],
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
    example += `Input:\n\n\`\`\`json\n${JSON.stringify(examples[remapper].input, null, spacing)}\n\`\`\`\n`;
  }

  if (!exclude.includes('remapper')) {
    example += `\`\`\`yaml\n${stringify(examples[remapper].remapper)}\n\`\`\`\n`;
  }

  if (!exclude.includes('result')) {
    const spacing = result === 'pretty' && 2;
    example += `Result:\n\n\`\`\`json\n${JSON.stringify(examples[remapper].result, null, spacing)}\n\`\`\`\n`;
  }

  return example;
}

export function createExampleContext(
  url: URL,
  lang: string,
  userInfo?: UserInfo,
  history?: [],
): RemapperContext {
  return {
    getMessage: ({ defaultMessage }) => new IntlMessageFormat(defaultMessage, lang, undefined),
    getVariable: (name) => (name === 'MY_VARIABLE' ? 'variable value' : null),
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
    },
  };
}
