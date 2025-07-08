import { remap } from '@appsemble/lang-sdk';
import { describe, expect, it } from 'vitest';

import { validateEnum } from './validateEnum.js';
import { type EnumField } from '../../../block.js';

describe('validateEnum', () => {
  it('should return the first requirement that does not validate', () => {
    const field: EnumField = {
      type: 'enum',
      name: 'test',
      enum: [{ value: 'a' }, { value: 'b' }, { value: 'c' }],
      requirements: [{ required: true }],
    };

    expect(validateEnum(field, undefined, remap)).toBe(field.requirements[0]);
    expect(validateEnum(field, null, remap)).toBe(field.requirements[0]);
  });

  it('should return undefined if it validates correctly', () => {
    const field: EnumField = {
      type: 'enum',
      name: 'test',
      enum: [{ value: 'a' }, { value: 'b' }, { value: 'c' }],
      requirements: [{ required: true }],
    };

    expect(validateEnum(field, 'a', remap)).toBeUndefined();
  });

  it('should ignore the required requirement if it resolves to false', () => {
    const field: EnumField = {
      type: 'enum',
      name: 'test',
      enum: [{ value: 'a' }, { value: 'b' }, { value: 'c' }],
      requirements: [{ required: false }],
    };

    expect(validateEnum(field, undefined, remap)).toBeUndefined();
    expect(validateEnum(field, null, remap)).toBeUndefined();
  });

  it('should validate prohibited requirements', () => {
    const field: EnumField = {
      type: 'enum',
      name: 'test',
      enum: [{ value: 'a' }, { value: 'b' }, { value: 'c' }],
      requirements: [{ prohibited: true }],
    };

    expect(validateEnum(field, 'a', remap)).toStrictEqual(field.requirements[0]);
    expect(validateEnum(field, undefined, remap)).toBeUndefined();
    expect(validateEnum(field, null, remap)).toBeUndefined();
  });

  it('should ignore the prohibited requirement if it resolves to false', () => {
    const field: EnumField = {
      type: 'enum',
      name: 'test',
      enum: [{ value: 'a' }, { value: 'b' }, { value: 'c' }],
      requirements: [{ prohibited: false }],
    };

    expect(validateEnum(field, 'a', remap)).toBeUndefined();
  });

  it('should return undefined on valid falsy values', () => {
    const field: EnumField = {
      type: 'enum',
      name: 'test',
      enum: [{ value: '' }, { value: 'b' }, { value: 'c' }],
      requirements: [{ required: true }],
    };

    expect(validateEnum(field, '', remap)).toBeUndefined();
  });
});
