import { remap } from '@appsemble/lang-sdk';
import { describe, expect, it } from 'vitest';

import { validateNumber } from './validateNumber.js';
import { type NumberField } from '../../../block.js';

describe('validateNumber', () => {
  it('should return the first requirement that does not validate', () => {
    const field: NumberField = {
      type: 'number',
      name: 'test',
      requirements: [{ required: true }, { max: 5 }],
    };

    expect(validateNumber(field, null, remap)).toStrictEqual(field.requirements[0]);
  });

  it('should should return undefined if it validates correctly', () => {
    const field: NumberField = {
      type: 'number',
      name: 'test',
      requirements: [{ required: true }],
    };

    expect(validateNumber(field, 5, remap)).toBeUndefined();
  });

  it('should ignore the required requirement if it resolves to false', () => {
    const field: NumberField = {
      type: 'number',
      name: 'test',
      requirements: [{ required: false }],
    };

    expect(validateNumber(field, null, remap)).toBeUndefined();
  });

  it('should validate prohibited requirements', () => {
    const field: NumberField = {
      type: 'number',
      name: 'test',
      requirements: [{ prohibited: true }],
    };

    expect(validateNumber(field, 0, remap)).toStrictEqual(field.requirements[0]);
    expect(validateNumber(field, undefined as number, remap)).toBeUndefined();
  });

  it('should ignore the prohibited requirement if it resolves to false', () => {
    const field: NumberField = {
      type: 'number',
      name: 'test',
      requirements: [{ prohibited: false }],
    };

    expect(validateNumber(field, 0, remap)).toBeUndefined();
  });

  it('should validate min requirements', () => {
    const field: NumberField = {
      type: 'number',
      name: 'test',
      requirements: [{ min: 1 }],
    };

    expect(validateNumber(field, 1, remap)).toBeUndefined();
    expect(validateNumber(field, 0, remap)).toStrictEqual(field.requirements[0]);
  });

  it('should validate max requirements', () => {
    const field: NumberField = {
      type: 'number',
      name: 'test',
      requirements: [{ max: 1 }],
    };

    expect(validateNumber(field, 1, remap)).toBeUndefined();
    expect(validateNumber(field, 2, remap)).toStrictEqual(field.requirements[0]);
  });

  it('should validate step requirements', () => {
    const field: NumberField = {
      type: 'number',
      name: 'test',
      requirements: [{ step: 3.5 }],
    };

    expect(validateNumber(field, 3.5, remap)).toBeUndefined();
    expect(validateNumber(field, 4, remap)).toStrictEqual(field.requirements[0]);
  });

  it('should round down step requirements for integers', () => {
    const field: NumberField = {
      type: 'integer',
      name: 'test',
      requirements: [{ step: 3.5 }],
    };

    expect(validateNumber(field, 3, remap)).toBeUndefined();
    expect(validateNumber(field, 4, remap)).toStrictEqual(field.requirements[0]);
  });
});
