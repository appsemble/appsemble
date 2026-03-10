import { describe, expect, it } from 'vitest';

import { convertToCsv } from './convertToCsv.js';

describe('convertToCsv', () => {
  it('should throw an error if input is null', () => {
    const input: any = null;

    expect(() => convertToCsv(input as any)).toThrowError(new Error('No data'));
  });

  it('should return an error if the input has no keys', () => {
    const input = {};

    expect(() => convertToCsv(input)).toThrowError(new Error('No headers could be found'));
  });

  it('should return an error if the input is a primitive', () => {
    const input = 'foo';

    expect(() => convertToCsv(input as any)).toThrowError(
      new TypeError('Data is of an invalid type'),
    );
  });

  it('should correctly combines all headers', () => {
    const input = [
      { foo: 123, baz: 1 },
      { foo: 123, bar: 'bar' },
    ];
    const output = 'bar,baz,foo\r\n,1,123\r\nbar,,123\r\n';

    expect(convertToCsv(input)).toStrictEqual(output);
  });

  it('should support an arrays of objects', () => {
    const input = [{ foo: 123 }, { foo: 321 }];
    const output = 'foo\r\n123\r\n321\r\n';

    expect(convertToCsv(input)).toStrictEqual(output);
  });

  it('should escape strings containing commas', () => {
    const input = [{ 'foo,bar': 'foo,bar' }];
    const output = '"foo,bar"\r\n"foo,bar"\r\n';

    expect(convertToCsv(input)).toStrictEqual(output);
  });

  it('should escape strings containing newlines', () => {
    const input = { 'foo\r\nline2': 'foo\r\nbar' };
    const output = '"foo\r\nline2"\r\n"foo\r\nbar"\r\n';

    expect(convertToCsv(input)).toStrictEqual(output);
  });

  it('should escape quotes', () => {
    const input = { 'foo "example" bar': 'Lots of "str"ings"' };
    const output = '"foo ""example"" bar"\r\n"Lots of ""str""ings"""\r\n';

    expect(convertToCsv(input)).toStrictEqual(output);
  });

  it('should convert date objects', () => {
    const input = { foo: new Date(0) };
    const output = 'foo\r\n1970-01-01T00:00:00.000Z\r\n';

    expect(convertToCsv(input)).toStrictEqual(output);
  });

  it('should return null on empty results', () => {
    const input: any[] = [];
    const output: any = null;

    expect(convertToCsv(input)).toStrictEqual(output);
  });
});
