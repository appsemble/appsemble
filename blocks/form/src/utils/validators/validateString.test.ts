import { describe, expect, it } from 'vitest';

import { validateString } from './validateString.js';
import { type StringField } from '../../../block.js';

describe('validateString', () => {
  it('should return the first requirement that does not validate', () => {
    const field = {
      type: 'string',
      name: 'test',
      requirements: [{ required: true }, { minLength: 1 }],
    } as StringField;

    expect(validateString(field, null)).toStrictEqual(field.requirements[0]);
  });

  it('should should return undefined if it validates correctly', () => {
    const field = {
      type: 'string',
      name: 'test',
      requirements: [{ required: true }, { minLength: 1 }],
    } as StringField;

    expect(validateString(field, 'hello')).toBeUndefined();
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
