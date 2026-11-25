// https://github.com/jsdom/jsdom/issues/1612
Object.defineProperty(globalThis, 'crypto', {
  value: {
    /**
     * A predictable polyfill for `crypto.getRandomValues()`.
     *
     * The generated values are incremental with a modulus of 2⁸. This value fits within realistic
     * values of Uint8Array.
     */
    getRandomValues(arr: Uint8Array) {
      for (let i = 0; i < arr.length; i += 1) {
        // eslint-disable-next-line no-param-reassign
        arr[i] = i % 2 ** 8;
      }
    },
  },
});
