import { remap } from '@appsemble/lang-sdk';
import { describe, expect, it } from 'vitest';

import { validateDateTime } from './validateDateTime.js';
import { type DateTimeField } from '../../../block.js';

describe('validateDateTime', () => {
  it('should return the first requirement that does not validate', () => {
    const field: DateTimeField = {
      type: 'date-time',
      name: 'test',
      requirements: [{ required: true }],
    };

    expect(validateDateTime(field, null, remap)).toBe(field.requirements[0]);
  });

  it('should should return undefined if it validates correctly', () => {
    const field: DateTimeField = {
      type: 'date-time',
      name: 'test',
      requirements: [{ required: true }],
    };

    expect(validateDateTime(field, '2020-02-02T20:20:02.02Z', remap)).toBeUndefined();
  });

  it('should ignore the required requirement if it resolves to false', () => {
    const field: DateTimeField = {
      type: 'date-time',
      name: 'test',
      requirements: [{ required: false }],
    };

    expect(validateDateTime(field, null, remap)).toBeUndefined();
  });

  it('should validate prohibited requirements', () => {
    const field: DateTimeField = {
      type: 'date-time',
      name: 'test',
      requirements: [{ prohibited: true }],
    };

    expect(validateDateTime(field, '1969-12-31T14:00:00.000Z', remap)).toBe(field.requirements[0]);
    expect(validateDateTime(field, undefined, remap)).toBeUndefined();
  });

  it('should ignore the prohibited requirement if it resolves to false', () => {
    const field: DateTimeField = {
      type: 'date-time',
      name: 'test',
      requirements: [{ prohibited: false }],
    };

    expect(validateDateTime(field, '1969-12-31T14:00:00.000Z', remap)).toBeUndefined();
  });

  it('should validate from requirements', () => {
    const field: DateTimeField = {
      type: 'date-time',
      name: 'test',
      requirements: [{ from: { static: new Date(0) } }],
    };

    expect(validateDateTime(field, '1969-12-31T14:00:00.000Z', remap)).toBe(field.requirements[0]);
  });

  it('should validate from requirements based on a value from another field', () => {
    const values = { other: new Date(0) };
    const field: DateTimeField = {
      type: 'date-time',
      name: 'test',
      requirements: [{ from: { prop: 'other' } }],
    };

    expect(validateDateTime(field, '1969-12-31T14:00:00.000Z', remap, values)).toBe(
      field.requirements[0],
    );
  });

  it('should return undefined if date value invalid in from requirements', () => {
    const field: DateTimeField = {
      type: 'date-time',
      name: 'test',
      requirements: [{ from: { static: 'invalid' } }],
    };

    expect(validateDateTime(field, '1969-12-31T14:00:00.000Z', remap)).toBeUndefined();
  });

  it('should validate to requirements', () => {
    const field: DateTimeField = {
      type: 'date-time',
      name: 'test',
      requirements: [{ to: { static: '1969-12-31T14:00:00.000Z' } }],
    };

    expect(validateDateTime(field, '1970-12-31T14:00:00.000Z', remap)).toBe(field.requirements[0]);
  });

  it('should validate to requirements based on a value from another field', () => {
    const values = { other: '1969-12-31T14:00:00.000Z' };
    const field: DateTimeField = {
      type: 'date-time',
      name: 'test',
      requirements: [{ to: { prop: 'other' } }],
    };

    expect(validateDateTime(field, '1970-12-31T14:00:00.000Z', remap, values)).toBe(
      field.requirements[0],
    );
  });

  it('should return undefined if date value invalid in to requirements', () => {
    const field: DateTimeField = {
      type: 'date-time',
      name: 'test',
      requirements: [{ to: { static: 'invalid' } }],
    };

    expect(validateDateTime(field, '1969-12-31T14:00:00.000Z', remap)).toBeUndefined();
  });
});
