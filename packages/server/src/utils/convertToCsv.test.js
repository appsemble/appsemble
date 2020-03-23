import convertToCsv from './convertToCsv';

describe('convertToCsv', () => {
  it('returns an empty string if the input is empty', () => {
    const input = {};
    const output = '';

    expect(convertToCsv(input)).toStrictEqual(output);
  });

  it('returns an empty string if the input is a primitive', () => {
    const inputs = ['foo', '123'];
    const output = '';

    inputs.forEach(input => {
      expect(convertToCsv(input)).toStrictEqual(output);
    });
  });

  it('correctly combines all headers', () => {
    const input = [
      { foo: 123, baz: 1 },
      { foo: 123, bar: 'bar' },
    ];
    const output = 'foo,baz,bar\r\n123,1,\r\n123,,bar';

    expect(convertToCsv(input)).toStrictEqual(output);
  });

  it('supports arrays of objects', () => {
    const input = [{ foo: 123 }, { foo: 321 }];
    const output = 'foo\r\n123\r\n321';

    expect(convertToCsv(input)).toStrictEqual(output);
  });

  it('escapes non-primitives', () => {
    const inputs = [{ foo: 'foo,bar' }, { foo: 'foo\r\nbar' }];
    const outputs = ['foo\r\n"foo,bar"', 'foo\r\n"foo\r\nbar"'];

    inputs.forEach((input, index) => {
      expect(convertToCsv(input)).toStrictEqual(outputs[index]);
    });
  });

  it('escapes quotes', () => {
    const input = { foo: 'Lots of "str"ings"' };
    const output = 'foo\r\n"Lots of ""str""ings"""';

    expect(convertToCsv(input)).toStrictEqual(output);
  });
});
