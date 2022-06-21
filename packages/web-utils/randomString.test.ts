import { randomString } from './randomString';

it('should generate a random string', () => {
  const result = randomString();
  expect(result).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZabcd');
});

it('should accept a length', () => {
  const result = randomString(100);
  expect(result).toBe(
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijkl',
  );
});
