import type { DateTimeField } from '../../../block';
import { validateDateTime } from './validateDateTime';

describe('validateString', () => {
  it('should return the first requirement that does not validate', () => {
    const field: DateTimeField = {
      type: 'date-time',
      name: 'test',
      requirements: [{ required: true }],
    };

    expect(validateDateTime(field, null)).toBe(field.requirements[0]);
  });

  it('should should return undefined if it validates correctly', () => {
    const field: DateTimeField = {
      type: 'date-time',
      name: 'test',
      requirements: [{ required: true }],
    };

    expect(validateDateTime(field, '2020-02-02T20:20:02.02Z')).toBeUndefined();
  });
});
