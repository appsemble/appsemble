import { describe, expect, it } from 'vitest';

import { validateFile } from './validateFile.js';
import { type FileField } from '../../../block.js';

describe('validateFile', () => {
  it('should should return undefined if it validates correctly', () => {
    const field = {
      type: 'file',
      name: 'test',
      requirements: [{ required: true }],
    } as FileField;

    expect(validateFile(field, {} as File)).toBeUndefined();
  });

  it('should return the first requirement that does not validate', () => {
    const field = {
      type: 'file',
      name: 'test',
      requirements: [{ required: true }, { max: 5 }],
    } as FileField;

    expect(validateFile(field, null)).toStrictEqual(field.requirements[0]);
    expect(validateFile({ ...field, repeated: true }, [])).toStrictEqual(field.requirements[0]);
  });

  it('should ignore min and max requirements if the field is not repeated', () => {
    const field = {
      type: 'file',
      name: 'test',
      repeated: false,
      requirements: [{ minLength: 2, maxLength: 2 }],
    } as FileField;

    expect(validateFile(field, [{} as File])).toBeUndefined();
    expect(validateFile(field, [{} as File, {} as File])).toBeUndefined();
  });

  it('should validate minLength requirements', () => {
    const field = {
      type: 'file',
      name: 'test',
      repeated: true,
      requirements: [{ minLength: 2 }],
    } as FileField;

    expect(validateFile(field, [{} as File, {} as File])).toBeUndefined();
    expect(validateFile(field, [])).toStrictEqual(field.requirements[0]);
  });

  it('should validate maxLength requirements', () => {
    const field = {
      type: 'file',
      name: 'test',
      repeated: true,
      requirements: [{ maxLength: 2 }],
    } as FileField;

    expect(validateFile(field, [{} as File, {} as File])).toBeUndefined();
    expect(validateFile(field, [{} as File, {} as File, {} as File])).toStrictEqual(
      field.requirements[0],
    );
  });

  it('should check minSize and maxSize requirements', () => {
    const field = {
      type: 'file',
      name: 'test',
      repeated: false,
      requirements: [{ minSize: 2 }, { maxSize: 2 }],
    } as FileField;

    expect(validateFile(field, { size: 2 } as File)).toBeUndefined();
    expect(validateFile(field, { size: 1 } as File)).toStrictEqual(field.requirements[0]);
    expect(validateFile(field, { size: 3 } as File)).toStrictEqual(field.requirements[1]);
  });

  it('should check minSize and maxSize requirements in repeated fields', () => {
    const field = {
      type: 'file',
      name: 'test',
      repeated: true,
      requirements: [{ minSize: 2 }, { maxSize: 2 }],
    } as FileField;

    expect(validateFile(field, [{ size: 2 } as File])).toBeUndefined();
    expect(validateFile(field, [{ size: 1 } as File])).toStrictEqual(field.requirements[0]);
    expect(validateFile(field, [{ size: 3 } as File])).toStrictEqual(field.requirements[1]);
  });

  it('should check mime types', () => {
    const field = {
      type: 'file',
      name: 'test',
      requirements: [{ accept: ['image/jpeg', 'image/png'] }],
    } as FileField;

    expect(validateFile(field, { type: 'image/jpeg' } as File)).toBeUndefined();

    expect(validateFile(field, { type: 'image/svg+xml' } as File)).toStrictEqual(
      field.requirements[0],
    );

    expect(
      validateFile({ ...field, repeated: true }, [
        { type: 'image/jpeg' } as File,
        { type: 'image/png' } as File,
      ]),
    ).toBeUndefined();

    expect(
      validateFile({ ...field, repeated: true }, [
        { type: 'image/svg+xml' } as File,
        { type: 'image/png' } as File,
      ]),
    ).toStrictEqual(field.requirements[0]);
  });

  it('should check combining mime types', () => {
    const field = {
      type: 'file',
      name: 'test',
      requirements: [{ accept: ['image/*'] }],
    } as FileField;

    expect(validateFile(field, { type: 'image/jpeg' } as File)).toBeUndefined();
    expect(validateFile(field, { type: 'image/svg+xml' } as File)).toBeUndefined();
    expect(validateFile(field, { type: 'video/quicktime' } as File)).toStrictEqual(
      field.requirements[0],
    );

    expect(
      validateFile({ ...field, repeated: true }, [
        { type: 'image/jpeg' } as File,
        { type: 'image/png' } as File,
      ]),
    ).toBeUndefined();

    expect(
      validateFile({ ...field, repeated: true }, [
        { type: 'image/svg+xml' } as File,
        { type: 'image/png' } as File,
      ]),
    ).toBeUndefined();

    expect(
      validateFile({ ...field, repeated: true }, [
        { type: 'image/svg+xml' } as File,
        { type: 'video/quicktime' } as File,
      ]),
    ).toStrictEqual(field.requirements[0]);
  });

  it('should check complex combining mime types', () => {
    const field = {
      type: 'file',
      name: 'test',
      requirements: [{ accept: ['image/*', 'video/quicktime'] }],
    } as FileField;

    expect(validateFile(field, { type: 'image/jpeg' } as File)).toBeUndefined();
    expect(validateFile(field, { type: 'image/svg+xml' } as File)).toBeUndefined();
    expect(validateFile(field, { type: 'video/quicktime' } as File)).toBeUndefined();
    expect(validateFile(field, { type: 'video/x-msvideo' } as File)).toStrictEqual(
      field.requirements[0],
    );

    expect(
      validateFile({ ...field, repeated: true }, [
        { type: 'image/jpeg' } as File,
        { type: 'image/png' } as File,
      ]),
    ).toBeUndefined();

    expect(
      validateFile({ ...field, repeated: true }, [
        { type: 'image/svg+xml' } as File,
        { type: 'image/png' } as File,
      ]),
    ).toBeUndefined();

    expect(
      validateFile({ ...field, repeated: true }, [
        { type: 'image/svg+xml' } as File,
        { type: 'video/quicktime' } as File,
      ]),
    ).toBeUndefined();

    expect(
      validateFile({ ...field, repeated: true }, [
        { type: 'image/svg+xml' } as File,
        { type: 'video/x-msvideo' } as File,
      ]),
    ).toStrictEqual(field.requirements[0]);
  });
});
