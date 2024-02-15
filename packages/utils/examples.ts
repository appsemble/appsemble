import { type Remappers } from '@appsemble/types';
import { stringify } from 'yaml';

interface RemapperExample {
  input: unknown;
  remapper: unknown;
  result: unknown;
}

export const examples: Record<keyof Remappers | 'array.map.1' | 'None', RemapperExample> = {
  None: {
    input: {},
    remapper: '',
    result: '',
  },
  app: {
    input: {},
    remapper: {
      app: {},
    },
    result: {},
  },
  appMember: {
    input: {},
    remapper: {},
    result: {},
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
        },
      },
    },
    result: [
      {
        index: 0,
        length: 3,
      },
      {
        index: 1,
        length: 3,
      },
      {
        index: 2,
        length: 3,
      },
    ],
  },
  'array.append': {
    input: {},
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
    input: {},
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
    input: {},
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
  'assign.history': {
    input: {},
    remapper: {},
    result: {},
  },
  context: {
    input: {},
    remapper: {},
    result: {},
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
  },
  'date.format': {
    input: '2023-07-03',
    remapper: {
      'date.format': null,
    },
    result: '2023-07-02T22:00:00.000Z',
  },
  'date.now': {
    input: {},
    remapper: {
      'date.now': null,
    },
    result: 'Mon Jul 03 2023 11:47:18 GMT+0200 (Midden-Europese zomertijd)',
  },
  'date.parse': {
    input: '02/11/2014',
    remapper: {
      'date.parse': 'MM/dd/yyyy',
    },
    result: 'Tue Feb 11 2014 00:00:00',
  },
  equals: {
    input: {},
    remapper: {},
    result: {},
  },
  'from.history': {
    input: {},
    remapper: {},
    result: {},
  },
  gt: {
    input: {},
    remapper: {},
    result: {},
  },
  history: {
    input: {},
    remapper: {},
    result: {},
  },
  ics: {
    input: {},
    remapper: {},
    result: {},
  },
  if: {
    input: {},
    remapper: {},
    result: {},
  },
  log: {
    input: {},
    remapper: {},
    result: {},
  },
  lt: {
    input: {},
    remapper: {},
    result: {},
  },
  match: {
    input: {},
    remapper: {},
    result: {},
  },
  not: {
    input: {},
    remapper: {},
    result: {},
  },
  'null.strip': {
    input: {},
    remapper: {},
    result: {},
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
    input: {},
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
    input: {},
    remapper: {},
    result: {},
  },
  page: {
    input: {},
    remapper: {},
    result: {},
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
    input: {},
    remapper: {},
    result: {},
  },
  'random.float': {
    input: {},
    remapper: {},
    result: {},
  },
  'random.integer': {
    input: {},
    remapper: {},
    result: {},
  },
  'random.string': {
    input: {},
    remapper: {},
    result: {},
  },
  root: {
    input: 'input',
    remapper: { root: null },
    result: 'input',
  },
  static: {
    input: {},
    remapper: {
      static: 'Hello!',
    },
    result: 'Hello!',
  },
  step: {
    input: {},
    remapper: {},
    result: {},
  },
  'string.case': {
    input: 'Patrick',
    remapper: {
      'string.case': 'upper',
    },
    result: 'PATRICK',
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
    input: {},
    remapper: {},
    result: {},
  },
  user: {
    input: {},
    remapper: {},
    result: {},
  },
} as const;

export function schemaExample(
  remapper: keyof typeof examples,
  options?: { input?: number; result?: number; exclude?: ('input' | 'remapper' | 'result')[] },
): string {
  const { exclude = [], input, result } = options ?? {};
  let example = '';

  if (!exclude.includes('input')) {
    example += `Input:\n\n\`\`\`json\n${JSON.stringify(examples[remapper].input, null, input)}\n\`\`\`\n`;
  }

  if (!exclude.includes('remapper')) {
    example += `\`\`\`yaml\n${stringify(examples[remapper].remapper)}\n\`\`\`\n`;
  }

  if (!exclude.includes('result')) {
    example += `Result:\n\n\`\`\`json\n${JSON.stringify(examples[remapper].result, null, result)}\n\`\`\`\n`;
  }

  return example;
}
