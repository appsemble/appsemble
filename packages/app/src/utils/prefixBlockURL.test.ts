import { prefixBlockURL } from './prefixBlockURL';

it('should populate the API url with block properties', () => {
  const result = prefixBlockURL({ type: '@appsemble/test', version: '1.0.0' }, 'test.css');
  expect(result).toBe('/api/blocks/@appsemble/test/versions/1.0.0/test.css');
});
