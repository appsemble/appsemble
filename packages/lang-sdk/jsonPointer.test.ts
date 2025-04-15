/*
# MIT License

Copyright © 2019 Remco Haszing

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the “Software”), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute,
sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial
portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES
OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import { describe, expect, it } from 'vitest';

import { escapeJsonPointer, unescapeJsonPointer } from './jsonPointer.js';

const tests = [
  ['foo/bar', 'foo~1bar'],
  ['foo~bar', 'foo~0bar'],
  ['foo~/bar', 'foo~0~1bar'],
  ['foo/~bar', 'foo~1~0bar'],
];

describe('escapeJsonPointer', () => {
  it.each(tests)('%s → %s', (unescaped, escaped) => {
    const result = escapeJsonPointer(unescaped);
    expect(result).toBe(escaped);
  });
});

describe('unescapeJsonPointer', () => {
  it.each(tests)('%s ← %s', (unescaped, escaped) => {
    const result = unescapeJsonPointer(escaped);
    expect(result).toBe(unescaped);
  });
});
