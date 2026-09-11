import { describe, expect, it } from 'vitest';

import { extractDate, extractDateBoundary } from './extractDate.js';

describe('extractDate', () => {
  it('preserves a date-only value', () => {
    expect(extractDate(new Date(2024, 1, 20, 12))).toBe('2024-02-20');
  });
});

describe('extractDateBoundary', () => {
  it('includes the entire minimum date', () => {
    const result = new Date(extractDateBoundary(new Date(2024, 1, 20, 12), 'start') as string);

    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(20);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });

  it('includes the entire maximum date', () => {
    const result = new Date(extractDateBoundary(new Date(2024, 1, 20, 12), 'end') as string);

    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(20);
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
    expect(result.getSeconds()).toBe(59);
    expect(result.getMilliseconds()).toBe(999);
  });
});
