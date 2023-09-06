import { type Schema } from 'jsonschema';

import { generateData } from './schemaGenerator.js';

let originalLocation: Location;

beforeEach(() => {
  originalLocation = window.location;
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: { assign: vi.fn() },
  });
});

afterEach(() => {
  window.location = originalLocation;
});

it('should not crash when schema is null', () => {
  const definitions: Record<string, Schema> = {};
  const result = generateData(definitions);
  expect(result).toBeUndefined();
});

it('should return empty string', () => {
  const result = generateData(null, { type: 'string' });
  expect(result).toBe('');
});

it('Boolean property should return false', () => {
  const result = generateData(null, { type: 'boolean' });
  expect(result).toBe(false);
});

it('number property should return 0', () => {
  const result = generateData(null, { type: 'number' });
  expect(result).toBe(0);
});

it('Array property should return []', () => {
  const result = generateData(null, { type: 'array' });
  expect(result).toStrictEqual([]);
});
