import { describe, expect, it } from 'vitest';

import { validateTags } from './validateTags.js';
import { type TagsField } from '../../../block.js';

describe('validateTags', () => {
  it('should return the first requirement that does not validate', () => {
    const field: TagsField = {
      type: 'tags',
      name: 'test',
      requirements: [{ minItems: 1 }, { min: 1 }],
    };

    // @ts-expect-error strictNullChecks not assignable to type
    expect(validateTags(field, null)).toStrictEqual(field.requirements?.[0]);
  });

  it('should should return undefined if it validates correctly', () => {
    const field: TagsField = {
      type: 'tags',
      name: 'test',
      requirements: [{ minItems: 1 }],
    };

    expect(validateTags(field, [1])).toBeUndefined();
  });

  it('should validate minItems requirements', () => {
    const field: TagsField = {
      type: 'tags',
      name: 'test',
      requirements: [{ minItems: 1 }],
    };

    expect(validateTags(field, [1])).toBeUndefined();
    // @ts-expect-error strictNullChecks not assignable to type
    expect(validateTags(field, [])).toStrictEqual(field.requirements[0]);
  });

  it('should validate maxItems requirements', () => {
    const field: TagsField = {
      type: 'tags',
      name: 'test',
      requirements: [{ maxItems: 1 }],
    };

    expect(validateTags(field, [1])).toBeUndefined();
    expect(validateTags(field, [1, 2])).toStrictEqual(field.requirements?.[0]);
  });

  it('should validate regex requirements', () => {
    const field: TagsField = {
      type: 'tags',
      name: 'test',
      requirements: [{ regex: 'abc' }],
    };

    expect(validateTags(field, ['abc'])).toBeUndefined();
    expect(validateTags(field, ['abd'])).toStrictEqual(field.requirements?.[0]);
  });

  it('should apply regex flags', () => {
    const field: TagsField = {
      type: 'tags',
      name: 'test',
      requirements: [{ regex: 'abc', flags: 'i' }],
    };

    expect(validateTags(field, ['ABC'])).toBeUndefined();
  });

  it('should validate min requirements', () => {
    const field: TagsField = {
      type: 'tags',
      name: 'test',
      requirements: [{ min: 1 }],
    };

    expect(validateTags(field, [1])).toBeUndefined();
    expect(validateTags(field, [0, 1])).toStrictEqual(field.requirements?.[0]);
  });

  it('should validate max requirements', () => {
    const field: TagsField = {
      type: 'tags',
      name: 'test',
      requirements: [{ max: 1 }],
    };

    expect(validateTags(field, [1])).toBeUndefined();
    expect(validateTags(field, [1, 2])).toStrictEqual(field.requirements?.[0]);
  });
});
