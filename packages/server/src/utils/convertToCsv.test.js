import convertToCsv from './convertToCsv';

describe('convertToCsv', () => {
  it('returns an empty string if the input is empty', () => {
    const input = JSON.stringify({});
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
    const input = JSON.stringify([
      { foo: 123, baz: 1 },
      { foo: 123, bar: 'bar' },
    ]);
    const output = 'foo,baz,bar\r\n123,1,\r\n123,,bar';

    expect(convertToCsv(input)).toStrictEqual(output);
  });

  it('supports arrays of objects', () => {
    const input = JSON.stringify([{ foo: 123 }, { foo: 321 }]);
    const output = 'foo\r\n123\r\n321';

    expect(convertToCsv(input)).toStrictEqual(output);
  });

  it('escapes non-primitives', () => {
    const inputs = [JSON.stringify({ foo: 'foo,bar' }), JSON.stringify({ foo: 'foo\r\nbar' })];
    const outputs = ['foo\r\n"foo,bar"', 'foo\r\n"foo\r\nbar"'];

    inputs.forEach((input, index) => {
      expect(convertToCsv(input)).toStrictEqual(outputs[index]);
    });
  });
});
