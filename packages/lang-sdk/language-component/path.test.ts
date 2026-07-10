import { describe, expect, it } from 'vitest';

import { formatPath, getPath } from './path.js';

describe('formatPath', () => {
  it('formats an empty path as the root pointer', () => {
    expect(formatPath([])).toBe('/');
  });

  it('joins segments with slashes and escapes `~` and `/` per JSON Pointer', () => {
    expect(formatPath(['pages', 0, 'blocks'])).toBe('/pages/0/blocks');
    expect(formatPath(['a/b', 'c~d'])).toBe('/a~1b/c~0d');
  });
});

describe('getPath', () => {
  it('reads a nested value by path', () => {
    expect(getPath({ a: { b: [10, 20] } }, ['a', 'b', 1])).toBe(20);
  });

  it('returns undefined when a path traverses through null or a scalar', () => {
    expect(getPath({ value: null }, ['value', 'child'])).toBeUndefined();
    expect(getPath({ value: 3 }, ['value', 'child'])).toBeUndefined();
  });
});
