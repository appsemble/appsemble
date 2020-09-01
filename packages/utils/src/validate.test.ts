import { SchemaValidationError, validate } from './validate';

describe('validate', () => {
  it('should validate data against a JSON schema', async () => {
    let error: SchemaValidationError;
    try {
      await validate({ type: 'object' }, 'string');
    } catch (err: unknown) {
      error = err as SchemaValidationError;
    }
    expect(error).toBeInstanceOf(SchemaValidationError);
    expect(error.message).toBe('Schema Validation Failed');
    expect(error.data).toStrictEqual({ '': { invalidType: true } });
  });

  it('should convert required property errors', async () => {
    let error: SchemaValidationError;
    try {
      await validate({ type: 'object', required: ['skills'] }, {});
    } catch (err: unknown) {
      error = err as SchemaValidationError;
    }
    expect(error.data).toStrictEqual({ skills: { required: true } });
  });
});
