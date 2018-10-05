import validate, { SchemaValidationError } from './validate';


describe('validate', () => {
  it('should validate data against a JSON schema', async () => {
    let error;
    try {
      await validate({ type: 'object' }, 'string');
    } catch (err) {
      error = err;
    }
    expect(error).toBeInstanceOf(SchemaValidationError);
    expect(error.message).toBe('Schema Validation Failed');
    expect(error.data).toEqual({ '': {} });
  });

  it('should convertg required property errors', async () => {
    let error;
    try {
      await validate({ required: ['skills'] }, {});
    } catch (err) {
      error = err;
    }
    expect(error.data).toEqual({ skills: {} });
  });
});
