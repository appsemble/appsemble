import randomString from './randomString';

it('should generate a random string', () => {
  const result = randomString();
  expect(result).toMatch(/^[a-z0-9]{30}$/i);
});

it('should accept a length', () => {
  const result = randomString(42);
  expect(result).toMatch(/^[a-z0-9]{42}$/i);
});
