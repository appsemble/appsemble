import { remap } from '@appsemble/utils';

import { DateTimeField } from '../../../block.js';
import { validateDateTime } from './validateDateTime.js';

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

  it('should validate from requirements', () => {
    const field: DateTimeField = {
      type: 'date-time',
      name: 'test',
      requirements: [{ from: { static: new Date(0) } }],
    };

    expect(validateDateTime(field, '1969-12-31T14:00:00.000Z', remap)).toBe(field.requirements[0]);
  });

  it('should validate to requirements', () => {
    const field: DateTimeField = {
      type: 'date-time',
      name: 'test',
      requirements: [{ to: { static: '1969-12-31T14:00:00.000Z' } }],
    };

    expect(validateDateTime(field, '1970-12-31T14:00:00.000Z', remap)).toBe(field.requirements[0]);
  });
});
