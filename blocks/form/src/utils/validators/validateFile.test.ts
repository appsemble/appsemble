import { remap } from '@appsemble/utils';
import { describe, expect, it } from 'vitest';

import { validateFile } from './validateFile.js';
import { type FileField } from '../../../block.js';

describe('validateFile', () => {
  it('should return undefined if it validates correctly', () => {
    const field: FileField = {
      type: 'file',
      name: 'test',
      requirements: [{ required: true }],
    };

    expect(validateFile(field, {} as File, remap)).toBeUndefined();
  });

  it('should return the first requirement that does not validate', () => {
    const field: FileField = {
      type: 'file',
      name: 'test',
      requirements: [{ required: true }, { maxLength: 5 }],
    };

    expect(validateFile(field, null, remap)).toStrictEqual(field.requirements[0]);
  });

  it('should ignore the required requirement if it resolves to false', () => {
    const field: FileField = {
      type: 'file',
      name: 'test',
      requirements: [{ required: false }, { maxLength: 5 }],
    };

    expect(validateFile(field, null, remap)).toBeUndefined();
  });

  it('should validate prohibited requirements', () => {
    const field: FileField = {
      type: 'file',
      name: 'test',
      requirements: [{ prohibited: true }],
    };

    expect(validateFile(field, {} as File, remap)).toStrictEqual(field.requirements[0]);
    expect(validateFile(field, null, remap)).toBeUndefined();
  });

  it('should ignore the prohibited requirement if it resolves to false', () => {
    const field: FileField = {
      type: 'file',
      name: 'test',
      requirements: [{ prohibited: false }],
    };

    expect(validateFile(field, {} as File, remap)).toBeUndefined();
  });

  it('should validate prohibited requirements when repeated', () => {
    const field: FileField = {
      type: 'file',
      name: 'test',
      repeated: true,
      requirements: [{ prohibited: true }],
    };

    expect(validateFile(field, [{} as File, {} as File], remap)).toStrictEqual(
      field.requirements[0],
    );
    expect(validateFile(field, [], remap)).toBeUndefined();
  });

  it('should ignore the prohibited requirement if it resolves to false when repeated', () => {
    const field: FileField = {
      type: 'file',
      name: 'test',
      repeated: true,
      requirements: [{ prohibited: false }],
    };

    expect(validateFile(field, [{} as File, {} as File], remap)).toBeUndefined();
  });

  it('should ignore minLength and maxLength requirements if the field is not repeated', () => {
    const field: FileField = {
      type: 'file',
      name: 'test',
      repeated: false,
      requirements: [{ minLength: 2, maxLength: 2 }],
    };

    expect(validateFile(field, [{} as File], remap)).toBeUndefined();
    expect(validateFile(field, [{} as File, {} as File], remap)).toBeUndefined();
  });

  it('should validate minLength requirements', () => {
    const field: FileField = {
      type: 'file',
      name: 'test',
      repeated: true,
      requirements: [{ minLength: 2 }],
    };

    expect(validateFile(field, [{} as File, {} as File], remap)).toBeUndefined();
    expect(validateFile(field, [], remap)).toStrictEqual(field.requirements[0]);
  });

  it('should validate maxLength requirements', () => {
    const field: FileField = {
      type: 'file',
      name: 'test',
      repeated: true,
      requirements: [{ maxLength: 2 }],
    };

    expect(validateFile(field, [{} as File, {} as File], remap)).toBeUndefined();
    expect(validateFile(field, [{} as File, {} as File, {} as File], remap)).toStrictEqual(
      field.requirements[0],
    );
  });

  it('should check minSize and maxSize requirements', () => {
    const field: FileField = {
      type: 'file',
      name: 'test',
      repeated: false,
      requirements: [{ minSize: 2 }, { maxSize: 2 }],
    };

    expect(validateFile(field, { size: 2 } as File, remap)).toBeUndefined();
    expect(validateFile(field, { size: 1 } as File, remap)).toStrictEqual(field.requirements[0]);
    expect(validateFile(field, { size: 3 } as File, remap)).toStrictEqual(field.requirements[1]);
  });

  it('should check minSize and maxSize requirements in repeated fields', () => {
    const field: FileField = {
      type: 'file',
      name: 'test',
      repeated: true,
      requirements: [{ minSize: 2 }, { maxSize: 2 }],
    };

    expect(validateFile(field, [{ size: 2 } as File], remap)).toBeUndefined();
    expect(validateFile(field, [{ size: 1 } as File], remap)).toStrictEqual(field.requirements[0]);
    expect(validateFile(field, [{ size: 3 } as File], remap)).toStrictEqual(field.requirements[1]);
  });

  it('should check mime types', () => {
    const field: FileField = {
      type: 'file',
      name: 'test',
      requirements: [{ accept: ['image/jpeg', 'image/png'] }],
    };

    expect(validateFile(field, { type: 'image/jpeg' } as File, remap)).toBeUndefined();

    expect(validateFile(field, { type: 'image/svg+xml' } as File, remap)).toStrictEqual(
      field.requirements[0],
    );

    expect(
      validateFile(
        { ...field, repeated: true },
        [{ type: 'image/jpeg' } as File, { type: 'image/png' } as File],
        remap,
      ),
    ).toBeUndefined();

    expect(
      validateFile(
        { ...field, repeated: true },
        [{ type: 'image/svg+xml' } as File, { type: 'image/png' } as File],
        remap,
      ),
    ).toStrictEqual(field.requirements[0]);
  });

  it('should check combining mime types', () => {
    const field: FileField = {
      type: 'file',
      name: 'test',
      requirements: [{ accept: ['image/*'] }],
    };

    expect(validateFile(field, { type: 'image/jpeg' } as File, remap)).toBeUndefined();
    expect(validateFile(field, { type: 'image/svg+xml' } as File, remap)).toBeUndefined();
    expect(validateFile(field, { type: 'video/quicktime' } as File, remap)).toStrictEqual(
      field.requirements[0],
    );

    expect(
      validateFile(
        { ...field, repeated: true },
        [{ type: 'image/jpeg' } as File, { type: 'image/png' } as File],
        remap,
      ),
    ).toBeUndefined();

    expect(
      validateFile(
        { ...field, repeated: true },
        [{ type: 'image/svg+xml' } as File, { type: 'image/png' } as File],
        remap,
      ),
    ).toBeUndefined();

    expect(
      validateFile(
        { ...field, repeated: true },
        [{ type: 'image/svg+xml' } as File, { type: 'video/quicktime' } as File],
        remap,
      ),
    ).toStrictEqual(field.requirements[0]);
  });

  it('should check complex combining mime types', () => {
    const field: FileField = {
      type: 'file',
      name: 'test',
      requirements: [{ accept: ['image/*', 'video/quicktime'] }],
    };

    expect(validateFile(field, { type: 'image/jpeg' } as File, remap)).toBeUndefined();
    expect(validateFile(field, { type: 'image/svg+xml' } as File, remap)).toBeUndefined();
    expect(validateFile(field, { type: 'video/quicktime' } as File, remap)).toBeUndefined();
    expect(validateFile(field, { type: 'video/x-msvideo' } as File, remap)).toStrictEqual(
      field.requirements[0],
    );

    expect(
      validateFile(
        { ...field, repeated: true },
        [{ type: 'image/jpeg' } as File, { type: 'image/png' } as File],
        remap,
      ),
    ).toBeUndefined();

    expect(
      validateFile(
        { ...field, repeated: true },
        [{ type: 'image/svg+xml' } as File, { type: 'image/png' } as File],
        remap,
      ),
    ).toBeUndefined();

    expect(
      validateFile(
        { ...field, repeated: true },
        [{ type: 'image/svg+xml' } as File, { type: 'video/quicktime' } as File],
        remap,
      ),
    ).toBeUndefined();

    expect(
      validateFile(
        { ...field, repeated: true },
        [{ type: 'image/svg+xml' } as File, { type: 'video/x-msvideo' } as File],
        remap,
      ),
    ).toStrictEqual(field.requirements[0]);
  });

  it('should allow null values if not required', () => {
    const field: FileField = {
      type: 'file',
      name: 'test',
    };

    expect(validateFile(field, null, remap)).toBeUndefined();
  });

  it('should not allow null values if required', () => {
    const field: FileField = {
      type: 'file',
      name: 'test',
      requirements: [{ required: true }],
    };

    expect(validateFile(field, null, remap)).toStrictEqual(field.requirements[0]);
  });

  it('should allow existing asset id', () => {
    const field: FileField = {
      type: 'file',
      name: 'test',
    };

    expect(validateFile(field, 'asset-1' as unknown as File, remap)).toBeUndefined();
  });

  it('should allow existing asset ids', () => {
    const field: FileField = {
      type: 'file',
      name: 'test',
      repeated: true,
    };

    expect(validateFile(field, ['asset-1', 'asset-2'] as unknown as File[], remap)).toBeUndefined();
  });
});
