import prefix from './prefix';

it('should prefix a string if the prefix is truthy', () => {
  const result = prefix('bar', 'foo');
  expect(result).toBe('foobar');
});

it('should not prefix a string if the prefix is falsy', () => {
  const result = prefix('bar', null);
  expect(result).toBe('bar');
});
