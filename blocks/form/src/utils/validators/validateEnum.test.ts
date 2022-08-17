import { EnumField, RadioField } from '../../../block.js';
import { validateEnum, validateRadio } from './validateEnum.js';

describe('validateEnum', () => {
  it('should return the first requirement that does not validate', () => {
    const field: EnumField = {
      type: 'enum',
      name: 'test',
      enum: [{ value: 'a' }, { value: 'b' }, { value: 'c' }],
      requirements: [{ required: true }],
    };

    expect(validateEnum(field)).toBe(field.requirements[0]);
  });

  it('should return undefined if it validates correctly', () => {
    const field: EnumField = {
      type: 'enum',
      name: 'test',
      enum: [{ value: 'a' }, { value: 'b' }, { value: 'c' }],
      requirements: [{ required: true }],
    };

    expect(validateEnum(field, 'a')).toBeUndefined();
  });

  it('should return undefined on valid falsy values', () => {
    const field: EnumField = {
      type: 'enum',
      name: 'test',
      enum: [{ value: '' }, { value: 'b' }, { value: 'c' }],
      requirements: [{ required: true }],
    };

    expect(validateEnum(field, '')).toBeUndefined();
  });
});

describe('validateRadio', () => {
  it('should return the first requirement that does not validate', () => {
    const field: RadioField = {
      type: 'radio',
      name: 'test',
      options: [{ value: 'a' }, { value: 'b' }, { value: 'c' }],
      requirements: [{ required: true }],
    };

    expect(validateRadio(field)).toBe(field.requirements[0]);
  });

  it('should return undefined if it validates correctly', () => {
    const field: RadioField = {
      type: 'radio',
      name: 'test',
      options: [{ value: 'a' }, { value: 'b' }, { value: 'c' }],
      requirements: [{ required: true }],
    };

    expect(validateRadio(field, 'a')).toBeUndefined();
  });

  it('should return undefined on valid falsy values', () => {
    const field: RadioField = {
      type: 'radio',
      name: 'test',
      options: [{ value: '' }, { value: 'b' }, { value: 'c' }],
      requirements: [{ required: true }],
    };

    expect(validateRadio(field, '')).toBeUndefined();
  });
});
