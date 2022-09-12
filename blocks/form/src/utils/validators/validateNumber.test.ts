import { NumberField } from '../../../block.js';
import { validateNumber } from './validateNumber.js';

describe('validateNumber', () => {
  it('should return the first requirement that does not validate', () => {
    const field = {
      type: 'number',
      name: 'test',
      requirements: [{ required: true }, { max: 5 }],
    } as NumberField;

    expect(validateNumber(field, null)).toStrictEqual(field.requirements[0]);
  });

  it('should should return undefined if it validates correctly', () => {
    const field = {
      type: 'number',
      name: 'test',
      requirements: [{ required: true }],
    } as NumberField;

    expect(validateNumber(field, 5)).toBeUndefined();
  });

  it('should validate min requirements', () => {
    const field = {
      type: 'number',
      name: 'test',
      requirements: [{ min: 1 }],
    } as NumberField;

    expect(validateNumber(field, 1)).toBeUndefined();
    expect(validateNumber(field, 0)).toStrictEqual(field.requirements[0]);
  });

  it('should validate max requirements', () => {
    const field = {
      type: 'number',
      name: 'test',
      requirements: [{ max: 1 }],
    } as NumberField;

    expect(validateNumber(field, 1)).toBeUndefined();
    expect(validateNumber(field, 2)).toStrictEqual(field.requirements[0]);
  });

  it('should validate step requirements', () => {
    const field = {
      type: 'number',
      name: 'test',
      requirements: [{ step: 3.5 }],
    } as NumberField;

    expect(validateNumber(field, 3.5)).toBeUndefined();
    expect(validateNumber(field, 4)).toStrictEqual(field.requirements[0]);
  });

  it('should round down step requirements for integers', () => {
    const field = {
      type: 'integer',
      name: 'test',
      requirements: [{ step: 3.5 }],
    } as NumberField;

    expect(validateNumber(field, 3)).toBeUndefined();
    expect(validateNumber(field, 4)).toStrictEqual(field.requirements[0]);
  });
});
