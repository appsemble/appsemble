import { describe, expect, it } from 'vitest';

import { validateSelection } from './validateSelection.js';
import { type SelectionField } from '../../../block.js';

describe('validateSelection', () => {
  it('should return the first requirement that does not validate', () => {
    const field = {
      type: 'selection',
      name: 'test',
      requirements: [{ minItems: 1 }],
    } as SelectionField;

    expect(validateSelection(field, null)).toStrictEqual(field.requirements[0]);
  });

  it('should should return undefined if it validates correctly', () => {
    const field = {
      type: 'selection',
      name: 'test',
      requirements: [{ minItems: 1 }],
    } as SelectionField;

    expect(validateSelection(field, [{ id: 1 }])).toBeUndefined();
  });

  it('should validate minItems requirements', () => {
    const field = {
      type: 'selection',
      name: 'test',
      requirements: [{ minItems: 1 }],
    } as SelectionField;

    expect(validateSelection(field, [{ id: 1 }])).toBeUndefined();
    expect(validateSelection(field, [])).toStrictEqual(field.requirements[0]);
  });

  it('should validate maxItems requirements', () => {
    const field = {
      type: 'selection',
      name: 'test',
      requirements: [{ maxItems: 1 }],
    } as SelectionField;

    expect(validateSelection(field, [{ id: 1 }])).toBeUndefined();
    expect(validateSelection(field, [{ id: 1 }, { id: 2 }])).toStrictEqual(field.requirements[0]);
  });
});
