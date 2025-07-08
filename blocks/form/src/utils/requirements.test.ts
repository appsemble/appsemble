import { remap } from '@appsemble/lang-sdk';
import { type BlockUtils } from '@appsemble/sdk';
import { describe, expect, it } from 'vitest';

import {
  getDisabledDays,
  getMaxDate,
  getMinDate,
  isRequired,
  isValidDate,
} from './requirements.js';
import { type Field, type Values } from '../../block.js';

type FieldWithRequirements = Field & { requirements?: any[] };

const utils = { remap } as unknown as BlockUtils;

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

describe('get min date', () => {
  it('should get min date', () => {
    const minDate = new Date('2023-02-28');
    const field = {
      requirements: [{ from: { static: minDate } }],
    } as FieldWithRequirements;

    expect(getMinDate(field, utils)).toStrictEqual(minDate);
  });

  it('should remap date as min date', () => {
    const minDate = new Date('2023-02-28');
    const values = { date: minDate };
    const field = {
      requirements: [{ from: { prop: 'date' } }],
    } as FieldWithRequirements;

    expect(getMinDate(field, utils, values)).toStrictEqual(minDate);
  });

  it('should get earliest date', () => {
    const firstMinDate = new Date('2023-02-28');
    const lastMinDate = new Date('2023-02-29');
    const field = {
      requirements: [{ from: { static: firstMinDate } }, { from: { static: lastMinDate } }],
    } as FieldWithRequirements;

    expect(getMinDate(field, utils)).toStrictEqual(firstMinDate);
  });
});

describe('get max date', () => {
  it('should get max date', () => {
    const maxDate = new Date('2023-02-28');
    const field = {
      requirements: [{ to: { static: maxDate } }],
    } as FieldWithRequirements;

    expect(getMaxDate(field, utils)).toStrictEqual(maxDate);
  });

  it('should remap date as max date', () => {
    const maxDate = new Date('2023-02-28');
    const values = { date: maxDate };
    const field = {
      requirements: [{ to: { prop: 'date' } }],
    } as FieldWithRequirements;

    expect(getMaxDate(field, utils, values)).toStrictEqual(maxDate);
  });

  it('should get latest date', () => {
    const firstMaxDate = new Date('2023-02-28');
    const lastMaxDate = new Date('2023-02-29');
    const field = {
      requirements: [{ to: { static: firstMaxDate } }, { to: { static: lastMaxDate } }],
    } as FieldWithRequirements;

    expect(getMaxDate(field, utils)).toStrictEqual(lastMaxDate);
  });
});

describe('is valid date', () => {
  it('should return true when date object is valid', () => {
    expect(isValidDate(new Date())).toBeTruthy();
  });

  it('should return false when date object is invalid', () => {
    expect(isValidDate(new Date('invalid'))).toBeFalsy();
  });
});
