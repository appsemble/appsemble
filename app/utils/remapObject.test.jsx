import {
  compileFilters,
  mapData,
} from './remapObject';


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
  ];

  fixtures.forEach(({ data, mapper, expected }) => {
    it(`should process ${mapper}`, () => {
      const fn = compileFilters(mapper);
      const result = fn(data);
      expect(result).toEqual(expected);
    });
  });
});


describe('mapData', () => {
  const fixtures = [
    {
      data: { foo: { bar: 'baz' } },
      mapper: { fooz: 'foo.bar' },
      expected: { fooz: 'baz' },
    },
  ];

  fixtures.forEach(({ data, mapper, expected }) => {
    it(`should process ${JSON.stringify(mapper)}`, () => {
      const result = mapData(mapper, data);
      expect(result).toEqual(expected);
    });
  });
});
