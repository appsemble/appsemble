import resolveJsonPointers from './resolveJsonPointers';

interface Fixture {
  name: string;
  actual: any;
  expected: any;
}

const fixtures: Fixture[] = [
  {
    name: 'convert an empty object to an empty object',
    actual: {},
    expected: {},
  },
  {
    name: 'retain undefined values',
    actual: undefined,
    expected: undefined,
  },
  {
    name: 'retain null values',
    actual: null,
    expected: null,
  },
  {
    name: 'retain numeric values',
    actual: 666,
    expected: 666,
  },
  {
    name: 'retain boolean values',
    actual: true,
    expected: true,
  },
  {
    name: 'retain string values',
    actual: 'I am a string',
    expected: 'I am a string',
  },
  {
    name: 'resolve a json pointer reference',
    actual: {
      key: 'value',
      ref: {
        $ref: '/key',
      },
    },
    expected: {
      key: 'value',
      ref: 'value',
    },
  },
  {
    name: 'recurse into objects',
    actual: {
      top: {
        nested: 'value',
        ref: {
          $ref: '/top/nested',
        },
      },
      ref: {
        $ref: '/top/nested',
      },
    },
    expected: {
      top: {
        nested: 'value',
        ref: 'value',
      },
      ref: 'value',
    },
  },
  {
    name: 'recurse into arrays',
    actual: {
      top: [
        'value',
        {
          $ref: '/top/0',
        },
      ],
    },
    expected: {
      top: ['value', 'value'],
    },
  },
  {
    name: 'resolve pointers to pointers',
    actual: {
      start: {
        $ref: '/progress',
      },
      progress: {
        $ref: '/end',
      },
      end: 'Game over',
    },
    expected: {
      start: 'Game over',
      progress: 'Game over',
      end: 'Game over',
    },
  },
  {
    name: 'not get stuck in an infinite loop due to circular references',
    actual: {
      start: {
        $ref: '/end',
      },
      end: {
        $ref: '/start',
      },
    },
    expected: {
      start: {
        $ref: '/end',
      },
      end: {
        $ref: '/start',
      },
    },
  },
  {
    name: 'not crash when referencing invalid pointers',
    actual: {
      foo: {
        $ref: '/invalid',
      },
    },
    expected: {
      foo: undefined,
    },
  },
];

describe('resolveJsonPointers', () => {
  fixtures.forEach(({ actual, expected, name }) => {
    it(`should ${name}`, () => {
      const result = resolveJsonPointers(actual);
      expect(result).toStrictEqual(expected);
    });
  });
});
