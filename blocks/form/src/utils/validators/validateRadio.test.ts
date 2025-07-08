import { remap } from '@appsemble/lang-sdk';
import { describe, expect, it } from 'vitest';

import { validateRadio } from './validateRadio.js';
import { type RadioField } from '../../../block.js';

describe('validateRadio', () => {
  it('should return the first requirement that does not validate', () => {
    const field: RadioField = {
      type: 'radio',
      name: 'test',
      options: [{ value: 'a' }, { value: 'b' }, { value: 'c' }],
      requirements: [{ required: true }],
    };

    expect(validateRadio(field, null, remap)).toBe(field.requirements[0]);
  });

  it('should return undefined if it validates correctly', () => {
    const field: RadioField = {
      type: 'radio',
      name: 'test',
      options: [{ value: 'a' }, { value: 'b' }, { value: 'c' }],
      requirements: [{ required: true }],
    };

    expect(validateRadio(field, 'a', remap)).toBeUndefined();
  });

  it('should ignore the required requirement if it resolves to false', () => {
    const field: RadioField = {
      type: 'radio',
      name: 'test',
      options: [{ value: 'a' }, { value: 'b' }, { value: 'c' }],
      requirements: [{ required: false }],
    };

    expect(validateRadio(field, undefined, remap)).toBeUndefined();
    expect(validateRadio(field, null, remap)).toBeUndefined();
  });

  it('should validate prohibited requirements', () => {
    const field: RadioField = {
      type: 'radio',
      name: 'test',
      options: [{ value: 'a' }, { value: 'b' }, { value: 'c' }],
      requirements: [{ prohibited: true }],
    };

    expect(validateRadio(field, 'a', remap)).toStrictEqual(field.requirements[0]);
    expect(validateRadio(field, undefined, remap)).toBeUndefined();
  });

  it('should ignore the prohibited requirement if it resolves to false', () => {
    const field: RadioField = {
      type: 'radio',
      name: 'test',
      options: [{ value: 'a' }, { value: 'b' }, { value: 'c' }],
      requirements: [{ prohibited: false }],
    };

    expect(validateRadio(field, 'a', remap)).toBeUndefined();
  });

  it('should return undefined on valid falsy values', () => {
    const field: RadioField = {
      type: 'radio',
      name: 'test',
      options: [{ value: '' }, { value: 'b' }, { value: 'c' }],
      requirements: [{ required: true }],
    };

    expect(validateRadio(field, '', remap)).toBeUndefined();
  });
});
