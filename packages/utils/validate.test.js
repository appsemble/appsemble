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
    expect(error.data).toEqual([{ code: 'INVALID_TYPE', field: 'object,string', message: 'Expected type object but found type string' }]);
  });

  it('should convertg required property errors', async () => {
    let error;
    try {
      await validate({ required: ['skills'] }, {});
    } catch (err) {
      error = err;
    }
    expect(error.data).toEqual([{ field: 'skills', code: 'OBJECT_MISSING_REQUIRED_PROPERTY', message: 'Missing required property: skills' }]);
  });
});
