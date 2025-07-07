import { expect, it } from 'vitest';

import { mapKeysRecursively } from './sequelize.js';

it('should return non object values unchanged', () => {
  expect(mapKeysRecursively(24)).toBe(24);
  expect(mapKeysRecursively('hello')).toBe('hello');
  expect(mapKeysRecursively(null)).toBeNull();
  expect(mapKeysRecursively(false)).toBe(false);
});

it('should return the object if comparator, logic and attribute are defined', () => {
  const input = {
    attribute: 'foo',
    comparator: '=',
    logic: 'bar',
  };

  expect(mapKeysRecursively(input)).toStrictEqual(input);
});

it('should distinguish between null and undefined values for logic field', () => {
  const input = {
    attribute: 'foo',
    comparator: '=',
    logic: null,
  };

  expect(mapKeysRecursively(input)).toStrictEqual(input);
  Object.assign(input, { logic: undefined });
  expect(mapKeysRecursively(input)).not.toStrictEqual(input);
});

it('should handle array inputs', () => {
  const input = [
    true,
    {
      attribute: 'foo',
      comparator: '=',
      logic: 'bar',
    },
    42,
  ];

  expect(mapKeysRecursively(input)).toStrictEqual(input);
});
