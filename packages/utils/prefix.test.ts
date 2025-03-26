import { expect, it } from 'vitest';

import { prefix } from './prefix.js';

it('should prefix a string if the prefix is truthy', () => {
  const result = prefix('bar', 'foo');
  expect(result).toBe('foobar');
});

it('should not prefix a string if the prefix is falsy', () => {
  // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
  const result = prefix('bar', null);
  expect(result).toBe('bar');
});
