import type { StringField } from 'blocks/form/block';

import validateString from './validateString';

describe('validateString', () => {
  it('should return the first requirement that does not validate', () => {
    const field = {
      type: 'string',
      name: 'test',
      requirements: [{ required: true }, { minLength: 1 }],
    } as StringField;
    const value: any = null;

    expect(validateString(field, value)).toStrictEqual(field.requirements[0]);
  });

  it('should should return undefined if it validates correctly', () => {
    const field = {
      type: 'string',
      name: 'test',
      requirements: [{ required: true }, { minLength: 1 }],
    } as StringField;
    const value = 'hello';

    expect(validateString(field, value)).toBeUndefined();
  });

  it('should validate minLength requirements', () => {
    const field = {
      type: 'string',
      name: 'test',
      requirements: [{ minLength: 1 }],
    } as StringField;

    expect(validateString(field, 'h')).toBeUndefined();
    expect(validateString(field, '')).toStrictEqual(field.requirements[0]);
  });

  it('should validate maxLength requirements', () => {
    const field = {
      type: 'string',
      name: 'test',
      requirements: [{ maxLength: 1 }],
    } as StringField;

    expect(validateString(field, 'h')).toBeUndefined();
    expect(validateString(field, 'hh')).toStrictEqual(field.requirements[0]);
  });

  it('should validate regex requirements', () => {
    const field = {
      type: 'string',
      name: 'test',
      requirements: [{ regex: 'abc' }],
    } as StringField;

    expect(validateString(field, 'abc')).toBeUndefined();
    expect(validateString(field, 'abd')).toStrictEqual(field.requirements[0]);
  });

  it('should apply regex flags', () => {
    const field = {
      type: 'string',
      name: 'test',
      requirements: [{ regex: 'abc', flags: 'i' }],
    } as StringField;

    expect(validateString(field, 'ABC')).toBeUndefined();
  });
});
