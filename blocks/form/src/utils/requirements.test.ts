import { Utils } from '@appsemble/sdk';
import { remap } from '@appsemble/utils';

import { Field, Values } from '../../block.js';
import { isRequired } from './requirements.js';

type FieldWithRequirements = Field & { requirements?: any[] };

describe('is required', () => {
  it('should be required', () => {
    const field = {
      requirements: [{ required: true }, { max: 5 }],
    } as FieldWithRequirements;

    expect(isRequired(field)).toBe(true);
  });

  it('should not be required', () => {
    const field = {
      requirements: [{ max: 5 }, { required: false }],
    } as FieldWithRequirements;

    expect(isRequired(field)).toBe(false);
  });

  it('should return false', () => {
    const field = {} as Field;

    expect(isRequired(field)).toBe(false);
  });

  it('should be remapped as true', () => {
    const field = {
      requirements: [{ max: 5 }, { required: { equals: [{ prop: 'field1' }, 'foo'] } }],
    } as FieldWithRequirements;

    const utils = { remap } as unknown as Utils;

    const values: Values = {
      field1: 'foo',
      field2: 'bar',
    };

    expect(isRequired(field, utils, values)).toBe(true);
  });

  it('should be remapped as false', () => {
    const field = {
      requirements: [
        { max: 5 },
        { required: { equals: [{ prop: 'field1' }, { prop: 'field2' }] } },
      ],
    } as FieldWithRequirements;

    const utils = { remap } as unknown as Utils;

    const values: Values = {
      field1: 'foo',
      field2: 'bar',
    };

    expect(isRequired(field, utils, values)).toBe(false);
  });
});
