import { afterEach, beforeEach, expect, it } from 'vitest';

import { polyfillStorage } from './polyfillStorage.js';

let originalLocal: PropertyDescriptor | undefined;
let originalSession: PropertyDescriptor | undefined;

beforeEach(() => {
  originalLocal = Object.getOwnPropertyDescriptor(window, 'localStorage');
  originalSession = Object.getOwnPropertyDescriptor(window, 'sessionStorage');
});

afterEach(() => {
  for (const [type, descriptor] of [
    ['localStorage', originalLocal],
    ['sessionStorage', originalSession],
  ] as const) {
    if (descriptor) {
      Object.defineProperty(window, type, descriptor);
    }
  }
});

it('installs an in-memory fallback when localStorage is null', () => {
  Object.defineProperty(window, 'localStorage', { configurable: true, value: null });

  polyfillStorage();

  expect(window.localStorage).not.toBeNull();
  window.localStorage.setItem('a', 'b');
  expect(window.localStorage.getItem('a')).toBe('b');
});

it('installs an in-memory fallback when accessing storage throws', () => {
  Object.defineProperty(window, 'sessionStorage', {
    configurable: true,
    get() {
      throw new Error('blocked');
    },
  });

  polyfillStorage();

  window.sessionStorage.setItem('x', 'y');
  expect(window.sessionStorage.getItem('x')).toBe('y');
  expect(window.sessionStorage.getItem('missing')).toBeNull();
});

it('leaves a working storage untouched', () => {
  window.localStorage.setItem('keep', '1');

  polyfillStorage();

  expect(window.localStorage.getItem('keep')).toBe('1');
});
