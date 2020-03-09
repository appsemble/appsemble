import prefixBlockURL from './prefixBlockURL';

jest.mock('./settings', () => ({
  __esModule: true,
  default: {
    apiUrl: 'http://localhost:9999',
  },
}));

it('should populate the API url with block properties', () => {
  const result = prefixBlockURL({ type: '@appsemble/test', version: '1.0.0' }, 'test.css');
  expect(result).toBe('http://localhost:9999/api/blocks/@appsemble/test/versions/1.0.0/test.css');
});
