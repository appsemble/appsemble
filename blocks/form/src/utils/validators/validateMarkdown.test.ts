import { remap } from '@appsemble/utils';
import { describe, expect, it } from 'vitest';

import { validateMarkdown } from './validateMarkdown.js';
import { type MarkdownField } from '../../../block.js';

describe('validateMarkdown', () => {
  it('should return the first requirement that does not validate', () => {
    const field: MarkdownField = {
      type: 'markdown',
      name: 'test',
      requirements: [{ required: true }],
    };

    expect(validateMarkdown(field, null, remap)).toStrictEqual(field.requirements[0]);
  });

  it('should should return undefined if it validates correctly', () => {
    const field: MarkdownField = {
      type: 'markdown',
      name: 'test',
      requirements: [{ required: true }],
    };

    expect(validateMarkdown(field, 'hello', remap)).toBeUndefined();
  });

  it('should ignore the required requirement if it resolves to false', () => {
    const field: MarkdownField = {
      type: 'markdown',
      name: 'test',
      requirements: [{ required: false }],
    };

    expect(validateMarkdown(field, null, remap)).toBeUndefined();
  });
});
