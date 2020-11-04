import { EnumField, RadioField } from '../../../block';
import { validateEnum, validateRadio } from './validateEnum';

describe('validateEnum', () => {
  it('should return the first requirement that does not validate', () => {
    const field: EnumField = {
      type: 'enum',
      name: 'test',
      enum: [{ value: 'a' }, { value: 'b' }, { value: 'c' }],
      requirements: [{ required: true }],
    };

    expect(validateEnum(field, null)).toBe(field.requirements[0]);
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

  it('should not validate correctly if value is not a valid option', () => {
    const field: EnumField = {
      type: 'enum',
      name: 'test',
      enum: [{ value: 'a' }, { value: 'b' }, { value: 'c' }],
      requirements: [{ required: true }],
    };

    expect(validateEnum(field, 'd')).toBe(field.requirements[0]);
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

    expect(validateRadio(field, null)).toBe(field.requirements[0]);
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

  it('should not validate correctly if value is not a valid option', () => {
    const field: RadioField = {
      type: 'radio',
      name: 'test',
      options: [{ value: 'a' }, { value: 'b' }, { value: 'c' }],
      requirements: [{ required: true }],
    };

    expect(validateRadio(field, 'd')).toBe(field.requirements[0]);
  });
});
