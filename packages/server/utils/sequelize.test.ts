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
  // The (attribute && comparator && (logic || logic === null)) guard short-
  // circuits on null and returns the input by reference. With undefined the
  // function falls through to the generic key-mapping branch and returns a
  // fresh object.
  const withNull = { attribute: 'foo', comparator: '=', logic: null };
  expect(mapKeysRecursively(withNull)).toBe(withNull);

  const withUndefined = { attribute: 'foo', comparator: '=', logic: undefined };
  expect(mapKeysRecursively(withUndefined)).not.toBe(withUndefined);
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
