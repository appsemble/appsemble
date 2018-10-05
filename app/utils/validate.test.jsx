import validate from './validate';


xdescribe('validate', () => {
  it('should validate a JSON schema error', async () => {
    await expect(validate({ type: 'object' }, 'string')).rejects;
  });
});
