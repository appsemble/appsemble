import { describe, expect, it } from 'vitest';
import { type Schema } from 'jsonschema';

import {
  clearValidationErrorsAtPath,
  normalizeResourceValidationErrors,
  validateResourceValue,
} from './validation.js';

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

  it('routes uploaded asset errors back to their resource field', () => {
    expect(
      normalizeResourceValidationErrors(
        [
          {
            message: 'does not contain valid file content',
            name: 'content',
            path: ['assets', 1],
          },
        ],
        new Map([[1, ['groups', 0, 'attachment']]]),
      ),
    ).toStrictEqual([
      {
        message: 'Does not contain valid file content.',
        path: ['groups', 0, 'attachment'],
      },
    ]);
  });

  it('routes an unmatched uploaded asset error to the resource form', () => {
    expect(
      normalizeResourceValidationErrors([
        {
          message: 'does not contain valid file content',
          name: 'content',
          path: ['assets', 1],
        },
      ]),
    ).toStrictEqual([
      {
        message: 'Does not contain valid file content.',
        path: [],
      },
    ]);
  });
});

describe('validateResourceValue', () => {
  it('clears a required field error when the value is corrected', () => {
    const schema: Schema = {
      properties: {
        name: { type: 'string' },
      },
      required: ['name'],
      type: 'object',
    };

    expect(validateResourceValue({}, schema)).toStrictEqual([
      {
        message: 'Requires property "name".',
        path: ['name'],
      },
    ]);
    expect(validateResourceValue({ name: 'Alice' }, schema)).toStrictEqual([]);
  });

  it('accepts valid falsy values', () => {
    const schema: Schema = {
      properties: {
        active: { type: 'boolean' },
        count: { type: 'number' },
      },
      required: ['active', 'count'],
      type: 'object',
    };

    expect(validateResourceValue({ active: false, count: 0 }, schema)).toStrictEqual([]);
  });
});

describe('clearValidationErrorsAtPath', () => {
  const errors = [
    { message: 'Replace this file.', path: ['attachment'] },
    { message: 'Enter a name.', path: ['profile', 'name'] },
    { message: 'Add another member.', path: ['profile', 'members'] },
  ];

  it('clears errors for the changed field and its descendants', () => {
    expect(clearValidationErrorsAtPath(errors, ['profile'])).toStrictEqual([
      { message: 'Replace this file.', path: ['attachment'] },
    ]);
  });

  it('preserves errors for unrelated fields', () => {
    expect(clearValidationErrorsAtPath(errors, ['profile', 'name'])).toStrictEqual([
      { message: 'Replace this file.', path: ['attachment'] },
      { message: 'Add another member.', path: ['profile', 'members'] },
    ]);
  });
});
