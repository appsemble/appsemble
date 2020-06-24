import trimUrl from './trimUrl';

it('should trim query parameters', () => {
  const result = trimUrl('https://example.com/path?query=parameter');
  expect(result).toBe('https://example.com/path');
});

it('should trim the hash', () => {
  const result = trimUrl('https://example.com/path#hashtag');
  expect(result).toBe('https://example.com/path');
});

it('should trim the port if its unnecessary', () => {
  const result = trimUrl('https://example.com:443/path');
  expect(result).toBe('https://example.com/path');
});

it('should keep the port if its necessary', () => {
  const result = trimUrl('https://example.com:1234/path');
  expect(result).toBe('https://example.com:1234/path');
});

it('should return null for invalid URLs', () => {
  const result = trimUrl('invalid');
  expect(result).toBeNull();
});
