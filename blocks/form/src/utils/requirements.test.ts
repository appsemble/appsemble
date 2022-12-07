import { Utils } from '@appsemble/sdk';
import { remap } from '@appsemble/utils';

import { Field, Values } from '../../block.js';
import { getDisabledDays, isRequired } from './requirements.js';

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

describe('getDisabledDays', () => {
  it('should support disabled days', () => {
    const field = {
      requirements: [
        { sunday: false },
        { monday: false },
        { tuesday: false },
        { wednesday: false },
        { thursday: false },
        { friday: false },
        { saturday: false },
      ],
    } as FieldWithRequirements;

    const dates = [
      // Sunday
      '2022-11-27',
      // Monday
      '2022-11-28',
      // Tuesday
      '2022-11-29',
      // Wednesday
      '2022-11-30',
      // Thursday
      '2022-12-01',
      // Friday
      '2022-12-02',
      // Saturday
      '2022-12-03',
    ];

    const [disabledDays] = getDisabledDays(field);

    dates.map((d) => expect(disabledDays(new Date(d))).toBe(true));
  });

  it('should handle undefined days to be allowed', () => {
    const field = {
      requirements: [{ monday: false }],
    } as FieldWithRequirements;

    const dates = [
      // Sunday
      '2022-11-27',
      // Monday
      // '2022-11-28',
      // Tuesday
      '2022-11-29',
      // Wednesday
      '2022-11-30',
      // Thursday
      '2022-12-01',
      // Friday
      '2022-12-02',
      // Saturday
      '2022-12-03',
    ];

    const [disabledDays] = getDisabledDays(field);

    dates.map((d) => expect(disabledDays(new Date(d))).toBe(false));
  });

  it('should return empty array when requirements undefined', () => {
    const field = {} as FieldWithRequirements;

    expect(getDisabledDays(field)).toStrictEqual([]);
  });

  it('should return empty array with no specified days', () => {
    const field = {
      requirements: [{ required: true }],
    } as FieldWithRequirements;

    expect(getDisabledDays(field)).toStrictEqual([]);
  });
});
