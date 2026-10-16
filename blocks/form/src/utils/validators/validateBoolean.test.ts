import { remap } from '@appsemble/lang-sdk';
import { type BlockUtils } from '@appsemble/sdk';
import { describe, expect, it } from 'vitest';

import { validate } from './index.js';
import { validateBoolean } from './validateBoolean.js';
import { type BooleanField } from '../../../block.js';

describe('validateBoolean', () => {
  it('should fail a required requirement if the checkbox is unchecked', () => {
    const field: BooleanField = {
      type: 'boolean',
      name: 'test',
      requirements: [{ required: true }],
    };

    // @ts-expect-error strictNullChecks not assignable to type
    expect(validateBoolean(field, false, remap)).toBe(field.requirements[0]);
    // @ts-expect-error strictNullChecks not assignable to type
    expect(validateBoolean(field, undefined, remap)).toBe(field.requirements[0]);
  });

  it('should return undefined if a required checkbox is checked', () => {
    const field: BooleanField = {
      type: 'boolean',
      name: 'test',
      requirements: [{ required: true }],
    };

    // @ts-expect-error strictNullChecks not assignable to type
    expect(validateBoolean(field, true, remap)).toBeUndefined();
  });

  it('should ignore the required requirement if it resolves to false', () => {
    const field: BooleanField = {
      type: 'boolean',
      name: 'test',
      requirements: [{ required: false }],
    };

    // @ts-expect-error strictNullChecks not assignable to type
    expect(validateBoolean(field, false, remap)).toBeUndefined();
  });

  it('should validate prohibited requirements', () => {
    const field: BooleanField = {
      type: 'boolean',
      name: 'test',
      requirements: [{ prohibited: true }],
    };

    // @ts-expect-error strictNullChecks not assignable to type
    expect(validateBoolean(field, true, remap)).toBe(field.requirements[0]);
    // @ts-expect-error strictNullChecks not assignable to type
    expect(validateBoolean(field, false, remap)).toBeUndefined();
  });

  it('should remap the required requirement against the form values', () => {
    const field: BooleanField = {
      type: 'boolean',
      name: 'test',
      requirements: [{ required: { prop: 'hasTrailer' } }],
    };

    // @ts-expect-error strictNullChecks not assignable to type
    expect(validateBoolean(field, false, remap, { hasTrailer: true })).toBe(field.requirements[0]);
    // @ts-expect-error strictNullChecks not assignable to type
    expect(validateBoolean(field, false, remap, { hasTrailer: false })).toBeUndefined();
  });

  it('should block an unchecked required checkbox when validating the form', () => {
    const field: BooleanField = {
      type: 'boolean',
      name: 'accept',
      requirements: [{ required: true, errorMessage: 'Please accept the terms' }],
    };
    const utils = { remap } as unknown as BlockUtils;

    expect(validate(field, { accept: false }, utils, 'Invalid', false)).toBe(
      'Please accept the terms',
    );
    expect(validate(field, { accept: true }, utils, 'Invalid', false)).toBeUndefined();
  });
});
