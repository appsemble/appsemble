import { compileFilters, remapData } from './remap';

describe('compileFilters', () => {
  const fixtures = [
    {
      data: { foo: 'bar' },
      mapper: 'foo',
      expected: 'bar',
    },
    {
      data: 'String',
      mapper: '|upper',
      expected: 'STRING',
    },
    {
      data: 'String',
      mapper: '|lower',
      expected: 'string',
    },
    {
      data: 'Chained filterS',
      mapper: '|lower|upper',
      expected: 'CHAINED FILTERS',
    },
    {
      data: { nested: 'and filtered' },
      mapper: 'nested|upper',
      expected: 'AND FILTERED',
    },
    {
      data: { deeply: { nested: 'data' } },
      mapper: 'deeply.nested',
      expected: 'data',
    },
    {
      data: { foo: [42, 1337, Math.PI] },
      mapper: 'foo.0',
      expected: 42,
    },
    {
      data: { foo: [42, 1337, Math.PI] },
      mapper: 'foo.1',
      expected: 1337,
    },
    {
      data: { foo: [42, 1337, Math.PI] },
      mapper: 'foo.2',
      expected: Math.PI,
    },
    {
      data: { foo: [42, 1337, Math.PI] },
      mapper: 'foo.-1',
      expected: Math.PI,
    },
    {
      data: { foo: [42, 1337, Math.PI] },
      mapper: 'foo.-2',
      expected: 1337,
    },
    {
      data: { foo: [42, 1337, Math.PI] },
      mapper: 'foo.-3',
      expected: 42,
    },
    {
      data: { foo: [42, 1337, Math.PI] },
      mapper: 'foo.length',
      expected: 3,
    },
  ];

  it.each(fixtures)('should process %p', ({ data, mapper, expected }) => {
    const fn = compileFilters(mapper);
    const result = fn(data);
    expect(result).toStrictEqual(expected);
  });
});

describe('remapData', () => {
  const fixtures = [
    {
      data: { foo: { bar: 'baz' } },
      mapper: { fooz: 'foo.bar' },
      expected: { fooz: 'baz' },
    },
  ];

  it.each(fixtures)('should process %j', ({ data, mapper, expected }) => {
    const result = remapData(mapper, data);
    expect(result).toStrictEqual(expected);
  });
});
