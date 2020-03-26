import { AppsembleError } from '@appsemble/node-utils/src';

import convertToCsv from './convertToCsv';

describe('convertToCsv', () => {
  it('should return an error if the input has no keys', () => {
    const input = {};

    expect(() => convertToCsv(input)).toThrow(new AppsembleError('No headers could be found'));
  });

  it('sould return an error if the input is a primitive', () => {
    const input = 'foo';

    expect(() => convertToCsv(input as any)).toThrow(
      new AppsembleError('Data is of an invalid type'),
    );
  });

  it('should correctly combines all headers', () => {
    const input = [
      { foo: 123, baz: 1 },
      { foo: 123, bar: 'bar' },
    ];
    const output = 'foo,baz,bar\r\n123,1,\r\n123,,bar';

    expect(convertToCsv(input)).toStrictEqual(output);
  });

  it('should support an arrays of objects', () => {
    const input = [{ foo: 123 }, { foo: 321 }];
    const output = 'foo\r\n123\r\n321';

    expect(convertToCsv(input)).toStrictEqual(output);
  });

  it('should escape non-primitives', () => {
    const inputs = [{ foo: 'foo,bar' }, { foo: 'foo\r\nbar' }];
    const outputs = ['foo\r\n"foo,bar"', 'foo\r\n"foo\r\nbar"'];

    inputs.forEach((input, index) => {
      expect(convertToCsv(input)).toStrictEqual(outputs[index]);
    });
  });

  it('should escape quotes', () => {
    const input = { foo: 'Lots of "str"ings"' };
    const output = 'foo\r\n"Lots of ""str""ings"""';

    expect(convertToCsv(input)).toStrictEqual(output);
  });
});
