import { describe, expect, it } from 'vitest';

import { normalizeResourceValidationErrors, validateResourceValue } from './validation.js';

describe('normalizeResourceValidationErrors', () => {
  it('routes a missing required property to that property', () => {
    expect(
      normalizeResourceValidationErrors([
        {
          argument: 'name',
          message: 'requires property "name"',
          name: 'required',
          path: ['profile'],
        },
      ]),
    ).toStrictEqual([
      {
        message: 'Requires property "name".',
        path: ['profile', 'name'],
      },
    ]);
  });

  it('preserves arbitrarily nested object and array paths', () => {
    expect(
      normalizeResourceValidationErrors([
        {
          message: 'does not meet minimum length of 2',
          name: 'minLength',
          path: ['groups', 1, 'members', 2, 'name'],
        },
      ]),
    ).toStrictEqual([
      {
        message: 'Does not meet minimum length of 2.',
        path: ['groups', 1, 'members', 2, 'name'],
      },
    ]);
  });
});

describe('validateResourceValue', () => {
  it('clears a required field error when the value is corrected', () => {
    const schema = {
      properties: {
        name: { type: 'string' },
      },
      required: ['name'],
      type: 'object',
    } as const;

    expect(validateResourceValue({}, schema)).toStrictEqual([
      {
        message: 'Requires property "name".',
        path: ['name'],
      },
    ]);
    expect(validateResourceValue({ name: 'Alice' }, schema)).toStrictEqual([]);
  });

  it('accepts valid falsy values', () => {
    const schema = {
      properties: {
        active: { type: 'boolean' },
        count: { type: 'number' },
      },
      required: ['active', 'count'],
      type: 'object',
    } as const;

    expect(validateResourceValue({ active: false, count: 0 }, schema)).toStrictEqual([]);
  });
});
