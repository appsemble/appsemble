import { remap } from '@appsemble/utils';
import { describe, expect, it } from 'vitest';

import { validateString } from './validateString.js';
import { type StringField } from '../../../block.js';

describe('validateString', () => {
  it('should return the first requirement that does not validate', () => {
    const field: StringField = {
      type: 'string',
      name: 'test',
      requirements: [{ required: true }, { minLength: 1 }],
    };

    expect(validateString(field, null, remap)).toStrictEqual(field.requirements[0]);
  });

  it('should should return undefined if it validates correctly', () => {
    const field: StringField = {
      type: 'string',
      name: 'test',
      requirements: [{ required: true }, { minLength: 1 }],
    };

    expect(validateString(field, 'hello', remap)).toBeUndefined();
  });

  it('should ignore the required requirement if it resolves to false', () => {
    const field: StringField = {
      type: 'string',
      name: 'test',
      requirements: [{ required: false }],
    };

    expect(validateString(field, null, remap)).toBeUndefined();
  });

  it('should validate prohibited requirements', () => {
    const field: StringField = {
      type: 'string',
      name: 'test',
      requirements: [{ prohibited: true }],
    };

    expect(validateString(field, 'h', remap)).toStrictEqual(field.requirements[0]);
    expect(validateString(field, '', remap)).toBeUndefined();
  });

  it('should ignore the prohibited requirement if it resolves to false', () => {
    const field: StringField = {
      type: 'string',
      name: 'test',
      requirements: [{ prohibited: false }],
    };

    expect(validateString(field, 'h', remap)).toBeUndefined();
  });

  it('should validate minLength requirements', () => {
    const field: StringField = {
      type: 'string',
      name: 'test',
      requirements: [{ minLength: 1 }],
    };

    expect(validateString(field, 'h', remap)).toBeUndefined();
    expect(validateString(field, '', remap)).toStrictEqual(field.requirements[0]);
  });

  it('should validate maxLength requirements', () => {
    const field: StringField = {
      type: 'string',
      name: 'test',
      requirements: [{ maxLength: 1 }],
    };

    expect(validateString(field, 'h', remap)).toBeUndefined();
    expect(validateString(field, 'hh', remap)).toStrictEqual(field.requirements[0]);
  });

  it('should validate regex requirements', () => {
    const field: StringField = {
      type: 'string',
      name: 'test',
      requirements: [{ regex: 'abc' }],
    };

    expect(validateString(field, 'abc', remap)).toBeUndefined();
    expect(validateString(field, 'abd', remap)).toStrictEqual(field.requirements[0]);
  });

  it('should apply regex flags', () => {
    const field: StringField = {
      type: 'string',
      name: 'test',
      requirements: [{ regex: 'abc', flags: 'i' }],
    };

    expect(validateString(field, 'ABC', remap)).toBeUndefined();
  });
});
